import os
import glob
import re

files = glob.glob("../client/app/(app)/**/*.tsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()
    
    # Remove import of MainLayout
    content = re.sub(r'import\s+{\s*MainLayout\s*}\s+from\s+["\'][^"\']+["\'];\n?', '', content)
    
    # Replace <MainLayout> with <>
    content = re.sub(r'<MainLayout>', '<>', content)
    
    # Replace </MainLayout> with </>
    content = re.sub(r'</MainLayout>', '</>', content)
    
    with open(file_path, "w") as f:
        f.write(content)

print("Done removing MainLayout")
