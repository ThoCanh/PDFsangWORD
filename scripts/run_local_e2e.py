from pathlib import Path

from app.services.pdf.pipeline import convert_pdf_to_docx_pipeline, EditableConversionUnavailable, OcrUnavailableError

log = []
def logp(*a):
    s = ' '.join(str(x) for x in a)
    log.append(s)
    print(s)

in_pdf = Path(r"c:/DocuFlowAI/pacc.pdf")
work_dir = Path(r"c:/DocuFlowAI/tmp_e2e")
work_dir.mkdir(parents=True, exist_ok=True)

try:
    logp("Starting pipeline: force_ocr=True (local OCR then Adobe)")
    result = convert_pdf_to_docx_pipeline(pdf_path=in_pdf, work_dir=work_dir, prefer_tier_a=False, force_ocr=True)
    logp("Mode:", result.mode)
    logp("Has text layer:", result.has_text_layer)
    out = Path(r"c:/DocuFlowAI/pacc_result_docx_from_pipeline.docx")
    out.write_bytes(result.docx_path.read_bytes())
    logp("Saved result to", out)
except OcrUnavailableError as e:
    logp("OCR unavailable:", e)
except EditableConversionUnavailable as e:
    logp("Editable conversion unavailable:", e)
except Exception as e:
    import traceback
    traceback.print_exc()
    logp("Error:", e)

# write log file
Path(r"c:/DocuFlowAI/logs").mkdir(parents=True, exist_ok=True)
Path(r"c:/DocuFlowAI/logs/e2e_run.log").write_text('\n'.join(log))
