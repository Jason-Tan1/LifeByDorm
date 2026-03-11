import os
import requests
from io import BytesIO
from PIL import Image

urls = {
    'utoronto': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Utoronto_coa.svg/1200px-Utoronto_coa.svg.png',
    'mcgill': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqrqd5QVZSCzVWwlfVdbCZ--xOYQQndsM2ng&s',
    'ubc': 'https://ires.ubc.ca/files/2019/10/ubc-logo.png',
    'waterloo': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/University_of_Waterloo_seal.svg/1200px-University_of_Waterloo_seal.svg.png',
    'alberta': 'https://e7.pngegg.com/pngimages/422/974/png-clipart-university-of-alberta-faculty-of-education-great-northern-concrete-toboggan-race-university-of-alberta-press-thumbnail.png',
    'mcmaster': 'https://e7.pngegg.com/pngimages/473/873/png-clipart-mcmaster-university-degroote-school-of-business-mcmaster-faculty-of-engineering-ryerson-university-university-of-new-south-wales-student-people-logo.png',
    'western': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStJMeYQOcsgNiZPELbwSB6WtOxXNtK7yADLw&s',
    'queens': 'https://www.queensu.ca/brand-central/sites/bcwww/files/uploaded_images/logos/Queens-viguide-logos-coatofarms-1200x589-2x_0.jpg'
}

def remove_white_bg(img):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    
    # Tolerances to catch off-white
    for item in datas:
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

os.makedirs('my-app/client/public/logos', exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0'}
for name, url in urls.items():
    print(f"Processing {name}...")
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            img = remove_white_bg(img)
            img.save(f'my-app/client/public/logos/{name}.png', 'PNG')
            print(f"Saved {name}.png")
        else:
            print(f"Failed to fetch {name}: {response.status_code}")
    except Exception as e:
        print(f"Error {name}: {e}")
