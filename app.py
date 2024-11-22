from flask import Flask, render_template, request, send_from_directory, jsonify
from PIL import Image
import os
import time

app = Flask(__name__)

# Paths
FRAME_PATH = os.path.join("static", "frame.png")
OUTPUT_DIR = os.path.join("static", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

CENTER_X, CENTER_Y, RADIUS = 1086, 1932, 910


@app.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html")


@app.route("/process", methods=["POST"])
def process_image():
    try:
        file = request.files.get("file")
        crop_x = float(request.form.get("crop_x", 0))
        crop_y = float(request.form.get("crop_y", 0))
        crop_width = float(request.form.get("crop_width", 0))
        crop_height = float(request.form.get("crop_height", 0))

        # Load uploaded image and crop it
        uploaded_image = Image.open(file).convert("RGBA")
        cropped_image = uploaded_image.crop((crop_x, crop_y, crop_x + crop_width, crop_y + crop_height))

        # Resize cropped image to fit the circular area
        diameter = RADIUS * 2
        resized_cropped_image = cropped_image.resize((diameter, diameter))

        # Load template and paste cropped image
        template_image = Image.open(FRAME_PATH).convert("RGBA")
        final_image = Image.new("RGBA", template_image.size)
        offset_x = CENTER_X - RADIUS
        offset_y = CENTER_Y - RADIUS
        final_image.paste(resized_cropped_image, (offset_x, offset_y), resized_cropped_image)
        final_image.paste(template_image, (0, 0), template_image)

        # Save final image
        output_filename = f"final_{int(time.time())}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        final_image.save(output_path, format="PNG")

        # Return static path for preview
        return jsonify({"status": "success", "path": f"static/output/{output_filename}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route("/download/<filename>")
def download_file(filename):
    return send_from_directory(OUTPUT_DIR, filename, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True)