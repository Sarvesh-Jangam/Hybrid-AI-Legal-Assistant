from pdf2image import convert_from_path

pdf_path = r"C:\Users\LENOVO\Downloads\567428885-A-copy-of-the-FIR.pdf"
pages = convert_from_path(pdf_path)

print(f"✅ Converted {len(pages)} pages successfully!")
