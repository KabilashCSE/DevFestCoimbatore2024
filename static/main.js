document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const cropImage = document.getElementById("cropImage");
    const generateButton = document.getElementById("generateButton");
    const previewImage = document.getElementById("previewImage");
    const downloadButton = document.getElementById("downloadButton");
    const shareButton = document.getElementById("shareButton");
    let cropper;

    // Initially hide buttons
    generateButton.style.display = 'none';
    downloadButton.style.display = 'none';
    shareButton.style.display = 'none';
  
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
  
      fetch("/process", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.status === "success") {
            const outputPath = result.path;
            previewImage.src = `/${outputPath}`;
            
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
                const file = await fetch(`/${outputPath}`)
                  .then((res) => res.blob())
                  .then((blob) => new File([blob], filename, { type: "image/png" }));
                await navigator.share({
                  title: "Generated Image",
                  files: [file],
                });
              } catch (err) {
                alert("Sharing failed: " + err.message);
              }
            };
          } else {
            alert("Error: " + result.message);
          }
        });
    });
});