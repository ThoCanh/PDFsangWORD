from pathlib import Path
from app.services.pdf.ocr import run_ocrmypdf, OcrFailedError
from app.services.pdf.pipeline import _pdf_text_looks_mojibake

pdir = Path('/tmp/test_scans')
vi = pdir / 'pacc_vi.pdf'
en = pdir / 'pacc_en.pdf'

for f in [vi, en]:
    print('\n===', f.name)
    out = f.with_name(f.stem + '_searchable.pdf')
    try:
        run_ocrmypdf(input_pdf=f, output_pdf=out, ocrmypdf_path='ocrmypdf', lang='vie+eng', timeout_sec=180, extra_path=None)
        print('OCR produced', out, 'size', out.stat().st_size)
        print('Mojibake?', _pdf_text_looks_mojibake(out, max_pages=2))
        # print sample text (first page)
        try:
            import fitz
            d = fitz.open(str(out))
            print('Text sample:', d.load_page(0).get_text('text')[:300])
            d.close()
        except Exception as e:
            print('Could not read PDF text:', e)
    except OcrFailedError as e:
        print('OCR failed:', e)
    except Exception as e:
        print('Error:', e)

print('\nDone')