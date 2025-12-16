from pathlib import Path
from app.services.pdf.pipeline import convert_pdf_to_docx_pipeline, EditableConversionUnavailable, OcrUnavailableError

pdir = Path('/tmp/test_scans')
vi = pdir / 'pacc_vi.pdf'
en = pdir / 'pacc_en.pdf'
work = Path('/tmp/test_work')
work.mkdir(parents=True, exist_ok=True)

for f in [vi, en]:
    print('\n===', f.name)
    try:
        r = convert_pdf_to_docx_pipeline(pdf_path=f, work_dir=work, prefer_tier_a=False, force_ocr=True)
        print('Mode:', r.mode, 'has_text_layer:', r.has_text_layer, 'docx:', r.docx_path)
        out = Path('/tmp') / (f.stem + '_result.docx')
        out.write_bytes(r.docx_path.read_bytes())
        print('Saved', out)
    except OcrUnavailableError as e:
        print('OCR unavailable:', e)
    except EditableConversionUnavailable as e:
        print('Editable conversion unavailable:', e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print('Error:', e)

print('\nDone')