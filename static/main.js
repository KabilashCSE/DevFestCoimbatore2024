document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const cropImage = document.getElementById("cropImage");
  const generateButton = document.getElementById("generateButton");
  const previewImage = document.getElementById("previewImage");
  const downloadButton = document.getElementById("downloadButton");
  const shareButton = document.getElementById("shareButton");
  const loadingSpinner = document.getElementById("loadingSpinner");
  let cropper;

  // Initially hide buttons and loading spinner
  generateButton.style.display = 'none';
  downloadButton.style.display = 'none';
  shareButton.style.display = 'none';
  loadingSpinner.style.display = 'none';  // Hide loading spinner initially

  // Handle file upload
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        cropImage.src = reader.result;
        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImage, { aspectRatio: 1 });
        // Show generate button after image selection
        generateButton.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle image generation
  generateButton.addEventListener("click", () => {
    if (!cropper) {
      alert("Please upload and crop an image first.");
      return;
    }

    const cropData = cropper.getData();
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("crop_x", cropData.x);
    formData.append("crop_y", cropData.y);
    formData.append("crop_width", cropData.width);
    formData.append("crop_height", cropData.height);

    // Show loading spinner when processing starts inside the right panel
    loadingSpinner.style.display = 'block';
    previewImage.style.display = 'none';  // Hide preview image while generating

    // Send data to the backend to process the image
    fetch("/process", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((result) => {
        // Hide loading spinner when processing is complete
        loadingSpinner.style.display = 'none';

        if (result.status === "success") {
          const outputPath = result.path;

          // Update the preview image with the generated result
          previewImage.src = `/tmp/${outputPath}`;
          previewImage.style.display = "block";  // Show preview image

          // Show and enable download/share buttons
          downloadButton.style.display = 'block';
          shareButton.style.display = 'block';
          downloadButton.disabled = false;
          shareButton.disabled = false;

          // Download button handler
          const filename = outputPath.split("/").pop();
          downloadButton.onclick = () => {
            window.location.href = `/download/${filename}`;
          };

          // Share button handler
          shareButton.onclick = async () => {
            try {
              const file = await fetch(`/tmp/${outputPath}`)
                .then((res) => res.blob())
                .then((blob) => new File([blob], filename, { type: "image/png" }));

              if (navigator.share) {
                await navigator.share({
                  title: "Generated Image",
                  files: [file],
                });
              } else {
                alert("Sharing not supported on your browser.");
              }
            } catch (err) {
              alert("Sharing failed: " + err.message);
            }
          };
        } else {
          alert("Error: " + result.message);
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Something went wrong during processing.");
        loadingSpinner.style.display = 'none';
      });
  });
});
