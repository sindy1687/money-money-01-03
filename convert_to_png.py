import os
from PIL import Image

def convert_jpg_to_png(directory):
    # List all files in the directory
    for filename in os.listdir(directory):
        if filename.lower().endswith(('.jpg', '.jpeg')):
            # Get the file path
            jpg_path = os.path.join(directory, filename)
            
            # Create the new filename with .png extension
            png_filename = os.path.splitext(filename)[0] + '.png'
            png_path = os.path.join(directory, png_filename)
            
            try:
                # Open the image and save as PNG
                with Image.open(jpg_path) as img:
                    # Convert to RGB if the image is in RGBA mode
                    if img.mode in ('RGBA', 'LA'):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[-1])
                        background.save(png_path, 'PNG')
                    else:
                        img.convert('RGB').save(png_path, 'PNG')
                
                print(f"Converted: {filename} -> {png_filename}")
                
                # Remove the original JPG file
                os.remove(jpg_path)
                print(f"Removed original file: {filename}")
                
            except Exception as e:
                print(f"Error converting {filename}: {str(e)}")

if __name__ == "__main__":
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    image_dir = os.path.join(script_dir, 'image')
    
    print("Starting image conversion...")
    convert_jpg_to_png(image_dir)
    print("Conversion completed!")
