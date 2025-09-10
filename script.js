const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const chooseFilesBtn = document.getElementById("chooseFiles");
const fileListEl = document.getElementById("fileList");
const totalCountEl = document.getElementById("totalCount");
const downloadBtn = document.getElementById("downloadBtn");
const outputNameInput = document.getElementById("outputName");
const orderSelect = document.getElementById("orderSelect");
const uploadNewBtn = document.getElementById("uploadNewBtn");

let filesData = [];

// Fungsi untuk membersihkan nama file dari angka dalam tanda kurung
function cleanFileName(name) {
  // Contoh: "data(1).txt" -> "data.txt"
  return name.replace(/\$\d+\$/g, "").trim();
}

// Handle pilih file lewat tombol "Pilih File"
chooseFilesBtn.addEventListener("click", () => fileInput.click());

// Handle tombol "Upload Baru" untuk upload file baru (ganti daftar file)
uploadNewBtn.addEventListener("click", () => fileInput.click());

// Handle file input (baik dari "Pilih File" atau "Upload Baru")
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    // Ganti filesData dengan file baru (jangan tambah)
    filesData = [];
    handleFiles(e.target.files);
    // Reset pilihan urutan ke default
    orderSelect.value = "upload";
    // Reset nama output
    outputNameInput.value = "";
  }
});

// Handle drag & drop
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    // Ganti filesData dengan file baru (jangan tambah)
    filesData = [];
    handleFiles(e.dataTransfer.files);
    // Reset pilihan urutan ke default
    orderSelect.value = "upload";
    // Reset nama output
    outputNameInput.value = "";
  }
});

// Baca file TXT dan simpan ke filesData
function handleFiles(selectedFiles) {
  let filesToLoad = Array.from(selectedFiles).filter((file) =>
    file.name.endsWith(".txt")
  );

  if (filesToLoad.length === 0) return;

  let loadedCount = 0;

  filesToLoad.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");
      filesData.push({ name: file.name, content });
      loadedCount++;
      if (loadedCount === filesToLoad.length) {
        renderFileList();
      }
    };
    reader.readAsText(file);
  });
}

// Render daftar file
function renderFileList() {
  fileListEl.innerHTML = "";
  let total = 0;

  filesData.forEach((file, index) => {
    total += file.content.length;
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.index = index;
    li.innerHTML = `<span>${file.name} (${file.content.length} baris)</span>`;
    fileListEl.appendChild(li);
  });

  totalCountEl.textContent = `Total nomor: ${total}`;
  initDragAndDrop();
}

// Drag & Drop reorder
function initDragAndDrop() {
  const listItems = document.querySelectorAll(".file-list li");

  listItems.forEach((li) => {
    li.addEventListener("dragstart", () => {
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      updateOrder();
    });
  });

  fileListEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(fileListEl, e.clientY);
    if (afterElement == null) {
      fileListEl.appendChild(dragging);
    } else {
      fileListEl.insertBefore(dragging, afterElement);
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// Update order filesData setelah drag & drop
function updateOrder() {
  const newOrder = [];
  document.querySelectorAll(".file-list li").forEach((li) => {
    const index = parseInt(li.dataset.index);
    newOrder.push(filesData[index]);
  });
  filesData = newOrder;

  // Update data-index di li agar tetap sinkron
  renderFileList();
}

// Download gabungan sesuai pilihan urutan
downloadBtn.addEventListener("click", () => {
  if (filesData.length === 0) {
    alert("Upload file dulu!");
    return;
  }

  let merged = [];

  if (orderSelect.value === "upload") {
    // Sesuai urutan upload (filesData sudah urut)
    filesData.forEach((file) => {
      merged = merged.concat(file.content);
    });
  } else if (orderSelect.value === "smallest") {
    // Urutkan filesData berdasarkan nama file yang sudah dibersihkan dari angka dalam tanda kurung
    const sortedFiles = [...filesData].sort((a, b) => {
      const nameA = cleanFileName(a.name).toLowerCase();
      const nameB = cleanFileName(b.name).toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    sortedFiles.forEach((file) => {
      merged = merged.concat(file.content);
    });
  }

  const blob = new Blob([merged.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  let filename = outputNameInput.value.trim();
  if (!filename) {
    filename = `${merged.length}.txt`;
  } else if (!filename.endsWith(".txt")) {
    filename += ".txt";
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});

// Simpan urutan upload asli agar bisa kembali ke urutan upload
let originalFilesData = [];

// Modifikasi handleFiles agar simpan originalFilesData juga
function handleFiles(selectedFiles) {
  let filesToLoad = Array.from(selectedFiles).filter((file) =>
    file.name.endsWith(".txt")
  );

  if (filesToLoad.length === 0) return;

  let loadedCount = 0;
  let tempFilesData = [];

  filesToLoad.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");
      tempFilesData.push({ name: file.name, content });
      loadedCount++;
      if (loadedCount === filesToLoad.length) {
        filesData = tempFilesData;
        originalFilesData = [...tempFilesData]; // simpan urutan asli
        renderFileList();
      }
    };
    reader.readAsText(file);
  });
}

// Event listener dropdown urutan
orderSelect.addEventListener("change", () => {
  if (orderSelect.value === "smallest") {
    // Urutkan filesData berdasarkan nama bersih
    filesData = [...filesData].sort((a, b) => {
      const nameA = cleanFileName(a.name).toLowerCase();
      const nameB = cleanFileName(b.name).toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  } else if (orderSelect.value === "upload") {
    // Kembalikan ke urutan upload asli
    filesData = [...originalFilesData];
  }
  renderFileList();
});

