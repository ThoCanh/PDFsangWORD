from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from ...utils.files import safe_filename


class AdobePdfServicesConvertError(RuntimeError):
    pass


@dataclass(frozen=True)
class AdobePdfServicesConvertResult:
    docx_path: Path


_TOKEN_CACHE: dict[str, Any] = {
    "token": None,
    "expires_at": 0.0,
}


def _now() -> float:
    return time.time()


def _get_access_token(*, base_url: str, client_id: str, client_secret: str, timeout_sec: int) -> str:
    cached = _TOKEN_CACHE.get("token")
    expires_at = float(_TOKEN_CACHE.get("expires_at") or 0.0)
    if cached and _now() < (expires_at - 60):
        return str(cached)

    url = f"{base_url}/token"
    try:
        with httpx.Client(timeout=timeout_sec) as client:
            resp = client.post(
                url,
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:  # noqa: BLE001
        raise AdobePdfServicesConvertError(f"Adobe token request failed: {e}") from e

    token = data.get("access_token")
    expires_in = data.get("expires_in")
    if not token:
        raise AdobePdfServicesConvertError("Adobe token response missing access_token")

    try:
        expires_in_s = int(expires_in) if expires_in is not None else 3600
    except Exception:  # noqa: BLE001
        expires_in_s = 3600

    _TOKEN_CACHE["token"] = token
    _TOKEN_CACHE["expires_at"] = _now() + float(expires_in_s)
    return str(token)


def _auth_headers(*, token: str, client_id: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "x-api-key": client_id,
    }


def _find_asset_id(obj: Any) -> str | None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if str(k).lower() in {"assetid", "asset_id"} and isinstance(v, str) and v.startswith("urn:"):
                return v
        for v in obj.values():
            found = _find_asset_id(v)
            if found:
                return found
    elif isinstance(obj, list):
        for item in obj:
            found = _find_asset_id(item)
            if found:
                return found
    return None


def convert_pdf_to_docx_adobe_pdf_services(
    *,
    pdf_path: Path,
    out_dir: Path,
    base_url: str,
    client_id: str,
    client_secret: str,
    job_timeout_sec: int,
    poll_interval_ms: int,
    ocr_lang: str | None,
) -> AdobePdfServicesConvertResult:
    if not pdf_path.exists():
        raise FileNotFoundError(str(pdf_path))

    out_dir.mkdir(parents=True, exist_ok=True)
    stem = safe_filename(pdf_path.stem, fallback="document")
    out_docx = out_dir / f"{stem}.docx"

    token = _get_access_token(
        base_url=base_url,
        client_id=client_id,
        client_secret=client_secret,
        timeout_sec=min(max(job_timeout_sec, 30), 300),
    )

    input_asset_id: str | None = None
    output_asset_id: str | None = None

    try:
        with httpx.Client(timeout=job_timeout_sec) as client:
            # 1) Create asset (get uploadUri)
            try:
                resp = client.post(
                    f"{base_url}/assets",
                    headers={
                        **_auth_headers(token=token, client_id=client_id),
                        "Content-Type": "application/json",
                    },
                    json={"mediaType": "application/pdf"},
                )
                resp.raise_for_status()
                asset_info = resp.json()
                input_asset_id = asset_info.get("assetID")
                upload_uri = asset_info.get("uploadUri")
                if not input_asset_id or not upload_uri:
                    raise AdobePdfServicesConvertError("Adobe assets response missing assetID/uploadUri")
            except Exception as e:  # noqa: BLE001
                raise AdobePdfServicesConvertError(f"Adobe asset create failed: {e}") from e

            # 2) Upload the PDF bytes to uploadUri
            try:
                with open(pdf_path, "rb") as f:
                    put = client.put(
                        upload_uri,
                        content=f,
                        headers={
                            "Content-Type": "application/pdf",
                        },
                    )
                put.raise_for_status()
            except Exception as e:  # noqa: BLE001
                raise AdobePdfServicesConvertError(f"Adobe asset upload failed: {e}") from e

            # 3) Start export job
            payload: dict[str, Any] = {
                "assetID": input_asset_id,
                "targetFormat": "docx",
            }
            if ocr_lang:
                payload["ocrLang"] = ocr_lang

            try:
                start = client.post(
                    f"{base_url}/operation/exportpdf",
                    headers={
                        **_auth_headers(token=token, client_id=client_id),
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                start.raise_for_status()
            except Exception as e:  # noqa: BLE001
                detail = None
                try:
                    detail = start.text  # type: ignore[name-defined]
                except Exception:  # noqa: BLE001
                    pass
                raise AdobePdfServicesConvertError(
                    f"Adobe export job create failed: {e}" + (f"; detail={detail}" if detail else "")
                ) from e

            status_url = start.headers.get("location")
            if not status_url:
                raise AdobePdfServicesConvertError("Adobe export job response missing Location header")
            if status_url.startswith("/"):
                status_url = f"{base_url}{status_url}"

            # 4) Poll status
            deadline = time.monotonic() + float(job_timeout_sec)
            last_status = None
            status_body: Any = None
            while True:
                if time.monotonic() > deadline:
                    raise AdobePdfServicesConvertError(
                        f"Adobe export job timed out after {job_timeout_sec}s (last_status={last_status})"
                    )

                r = client.get(
                    status_url,
                    headers=_auth_headers(token=token, client_id=client_id),
                )
                r.raise_for_status()
                status_body = r.json()

                status_val = str(status_body.get("status") or "").strip().lower()
                last_status = status_val or "unknown"
                if status_val in {"done", "succeeded", "success"}:
                    break
                if status_val in {"failed", "error"}:
                    raise AdobePdfServicesConvertError(f"Adobe export job failed: {status_body}")

                time.sleep(max(poll_interval_ms, 200) / 1000.0)

            # 5) Get output asset ID
            output_asset_id = _find_asset_id(status_body)
            if not output_asset_id:
                raise AdobePdfServicesConvertError(f"Adobe export job finished but no output assetID found: {status_body}")

            # 6) Get downloadUri for the output asset, then download DOCX
            try:
                meta = client.get(
                    f"{base_url}/assets/{output_asset_id}",
                    headers=_auth_headers(token=token, client_id=client_id),
                )
                meta.raise_for_status()
                download_uri = meta.json().get("downloadUri")
                if not download_uri:
                    raise AdobePdfServicesConvertError("Adobe asset get missing downloadUri")

                docx_resp = client.get(download_uri)
                docx_resp.raise_for_status()
                out_docx.write_bytes(docx_resp.content)
            except Exception as e:  # noqa: BLE001
                raise AdobePdfServicesConvertError(f"Adobe download failed: {e}") from e

        return AdobePdfServicesConvertResult(docx_path=out_docx)
    finally:
        # Best-effort cleanup of transient assets
        try:
            cleanup_token = _get_access_token(
                base_url=base_url,
                client_id=client_id,
                client_secret=client_secret,
                timeout_sec=30,
            )
            headers = _auth_headers(token=cleanup_token, client_id=client_id)
            with httpx.Client(timeout=30) as c:
                if input_asset_id:
                    c.delete(f"{base_url}/assets/{input_asset_id}", headers=headers)
                if output_asset_id:
                    c.delete(f"{base_url}/assets/{output_asset_id}", headers=headers)
        except Exception:  # noqa: BLE001
            pass
