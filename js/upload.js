/**
 * 助农宣传 - 图片上传页面交互
 * 实现图片上传、拖放、预览、多图管理等功能
 */
document.addEventListener('DOMContentLoaded', function() {
    // 元素引用
    const uploadZone = document.querySelector('.upload-zone');
    const cameraBtn = document.getElementById('cameraBtn');
    const albumBtn = document.getElementById('albumBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const imageGrid = document.getElementById('imageGrid');
    const emptyState = document.getElementById('emptyState');
    const imageCount = document.getElementById('imageCount');
    const uploadingMask = document.getElementById('uploadingMask');
    const uploadProgress = document.getElementById('uploadProgress');
    
    // 状态变量
    let uploadedImages = [];
    const MAX_IMAGES = 9;
    
    // 初始化拖放上传
    initDragAndDrop();
    
    // 初始化按钮事件
    initButtonEvents();
    
    // 从本地存储加载之前上传的图片
    loadImagesFromStorage();
    
    /**
     * 初始化拖放上传功能
     */
    function initDragAndDrop() {
        const dropZone = uploadZone.querySelector('div');
        
        // 拖动进入区域
        dropZone.addEventListener('dragenter', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });
        
        // 拖动在区域上方
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });
        
        // 拖动离开区域
        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        
        // 放下文件
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
        
        // 点击上传区域
        dropZone.addEventListener('click', function() {
            // 选择相册中的图片
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            
            input.onchange = function() {
                handleFiles(this.files);
            };
            
            input.click();
        });
    }
    
    /**
     * 初始化按钮事件
     */
    function initButtonEvents() {
        // 相册选择按钮
        albumBtn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            
            input.onchange = function() {
                handleFiles(this.files);
            };
            
            input.click();
        });
        
        // 拍照按钮
        cameraBtn.addEventListener('click', function() {
            // 检查是否支持媒体设备API
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showToast('您的浏览器不支持拍照功能', 'error');
                return;
            }
            
            takePhoto();
        });
        
        // 下一步按钮
        nextStepBtn.addEventListener('click', function() {
            if (uploadedImages.length > 0) {
                // 保存图片到本地存储
                localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
                
                // 跳转到下一个页面
                window.location.href = 'preview.html';
            }
        });
    }
    
    /**
     * 处理选择的文件
     */
    function handleFiles(files) {
        if (!files || files.length === 0) return;
        
        // 检查是否超过最大图片数
        if (uploadedImages.length + files.length > MAX_IMAGES) {
            showToast(`最多只能上传${MAX_IMAGES}张图片`, 'warning');
            
            // 只处理能加入的图片
            const availableSlots = MAX_IMAGES - uploadedImages.length;
            if (availableSlots <= 0) return;
            
            // 只处理前N张
            const filesToProcess = Array.from(files).slice(0, availableSlots);
            processImageFiles(filesToProcess);
        } else {
            processImageFiles(files);
        }
    }
    
    /**
     * 处理图片文件
     */
    function processImageFiles(files) {
        // 显示上传中遮罩
        uploadingMask.classList.remove('hidden');
        uploadingMask.style.display = 'flex';
        
        const filesToProcess = Array.from(files);
        let processedCount = 0;
        
        filesToProcess.forEach((file, index) => {
            // 验证文件类型
            if (!file.type.match('image.*')) {
                showToast(`仅支持图片文件`, 'error');
                return;
            }
            
            // 验证文件大小
            if (file.size > 5 * 1024 * 1024) { // 5MB
                showToast(`图片 ${file.name} 超过5MB限制`, 'error');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageUrl = e.target.result;
                
                // 压缩图片
                compressImage(imageUrl, file.type, function(compressedImageUrl) {
                    // 添加到图片列表
                    uploadedImages.push(compressedImageUrl);
                    
                    // 更新进度
                    processedCount++;
                    updateUploadProgress(processedCount / filesToProcess.length * 100);
                    
                    // 所有图片处理完成
                    if (processedCount === filesToProcess.length) {
                        // 隐藏上传中遮罩
                        setTimeout(() => {
                            uploadingMask.classList.add('hidden');
                            
                            // 更新UI
                            updateImageGrid();
                            
                            showToast('图片上传完成', 'success');
                        }, 500);
                    }
                });
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * 拍照功能
     */
    function takePhoto() {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                // 创建相机界面
                const cameraInterface = document.createElement('div');
                cameraInterface.className = 'fixed inset-0 bg-black z-50 flex flex-col';
                
                const video = document.createElement('video');
                video.className = 'flex-1 object-cover';
                video.autoplay = true;
                video.playsInline = true;
                video.srcObject = stream;
                
                const controls = document.createElement('div');
                controls.className = 'flex justify-between items-center p-4 bg-black';
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center';
                closeBtn.innerHTML = '<i class="fas fa-times"></i>';
                
                const captureBtn = document.createElement('button');
                captureBtn.className = 'w-16 h-16 rounded-full border-4 border-white flex items-center justify-center';
                captureBtn.innerHTML = '<div class="w-12 h-12 rounded-full bg-white"></div>';
                
                const switchBtn = document.createElement('button');
                switchBtn.className = 'w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center';
                switchBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                
                controls.appendChild(closeBtn);
                controls.appendChild(captureBtn);
                controls.appendChild(switchBtn);
                
                cameraInterface.appendChild(video);
                cameraInterface.appendChild(controls);
                
                document.body.appendChild(cameraInterface);
                
                // 关闭相机
                closeBtn.addEventListener('click', function() {
                    stream.getTracks().forEach(track => track.stop());
                    cameraInterface.remove();
                });
                
                // 拍照
                captureBtn.addEventListener('click', function() {
                    // 创建Canvas
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    // 设置Canvas尺寸
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    // 绘制视频帧到Canvas
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // 获取图片数据
                    const imageUrl = canvas.toDataURL('image/jpeg');
                    
                    // 压缩图片
                    compressImage(imageUrl, 'image/jpeg', function(compressedImageUrl) {
                        // 添加到图片列表
                        uploadedImages.push(compressedImageUrl);
                        
                        // 更新UI
                        updateImageGrid();
                        
                        // 关闭相机
                        stream.getTracks().forEach(track => track.stop());
                        cameraInterface.remove();
                        
                        showToast('照片已添加', 'success');
                    });
                });
                
                // 切换前后摄像头
                let frontCamera = true;
                switchBtn.addEventListener('click', function() {
                    frontCamera = !frontCamera;
                    
                    // 停止当前视频流
                    stream.getTracks().forEach(track => track.stop());
                    
                    // 获取新的视频流
                    navigator.mediaDevices.getUserMedia({
                        video: { facingMode: frontCamera ? 'user' : 'environment' }
                    }).then(function(newStream) {
                        stream = newStream;
                        video.srcObject = newStream;
                    });
                });
            })
            .catch(function(error) {
                console.error('访问相机失败:', error);
                showToast('无法访问相机，请检查权限设置', 'error');
            });
    }
    
    /**
     * 图片压缩
     */
    function compressImage(imageUrl, mimeType, callback) {
        const img = new Image();
        img.src = imageUrl;
        
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            
            // 计算压缩比例
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round(height * (maxDimension / width));
                    width = maxDimension;
                } else {
                    width = Math.round(width * (maxDimension / height));
                    height = maxDimension;
                }
            }
            
            // 创建Canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // 设置Canvas尺寸
            canvas.width = width;
            canvas.height = height;
            
            // 绘制图片到Canvas
            context.drawImage(img, 0, 0, width, height);
            
            // 获取压缩后的图片数据
            const compressedImageUrl = canvas.toDataURL(mimeType, 0.8);
            
            // 返回压缩后的图片
            callback(compressedImageUrl);
        };
    }
    
    /**
     * 更新图片网格
     */
    function updateImageGrid() {
        // 更新图片计数
        imageCount.textContent = `(${uploadedImages.length}/${MAX_IMAGES})`;
        
        // 更新下一步按钮状态
        if (uploadedImages.length > 0) {
            nextStepBtn.disabled = false;
            nextStepBtn.classList.remove('bg-gray-200', 'text-gray-400');
            nextStepBtn.classList.add('bg-green-500', 'text-white');
        } else {
            nextStepBtn.disabled = true;
            nextStepBtn.classList.add('bg-gray-200', 'text-gray-400');
            nextStepBtn.classList.remove('bg-green-500', 'text-white');
        }
        
        // 清空图片网格
        imageGrid.innerHTML = '';
        
        // 显示或隐藏空状态
        if (uploadedImages.length === 0) {
            emptyState.classList.remove('hidden');
            imageGrid.classList.add('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
            imageGrid.classList.remove('hidden');
        }
        
        // 添加图片到网格
        uploadedImages.forEach((imageUrl, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-preview-item';
            
            const image = document.createElement('img');
            image.src = imageUrl;
            image.alt = `图片 ${index + 1}`;
            
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-button';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.addEventListener('click', function(e) {
                e.stopPropagation();
                removeImage(index);
            });
            
            const imageOrder = document.createElement('div');
            imageOrder.className = 'image-order';
            imageOrder.textContent = index + 1;
            
            imageItem.appendChild(image);
            imageItem.appendChild(removeButton);
            imageItem.appendChild(imageOrder);
            
            imageGrid.appendChild(imageItem);
        });
        
        // 添加"添加更多"按钮
        if (uploadedImages.length < MAX_IMAGES) {
            const addMoreButton = document.createElement('div');
            addMoreButton.className = 'add-image-button';
            addMoreButton.innerHTML = `
                <i class="fas fa-plus"></i>
                <span>添加</span>
            `;
            
            addMoreButton.addEventListener('click', function() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = true;
                
                input.onchange = function() {
                    handleFiles(this.files);
                };
                
                input.click();
            });
            
            imageGrid.appendChild(addMoreButton);
        }
    }
    
    /**
     * 移除图片
     */
    function removeImage(index) {
        uploadedImages.splice(index, 1);
        updateImageGrid();
        showToast('图片已移除', 'success');
    }
    
    /**
     * 从本地存储加载图片
     */
    function loadImagesFromStorage() {
        const storedImages = localStorage.getItem('uploadedImages');
        
        if (storedImages) {
            uploadedImages = JSON.parse(storedImages);
            updateImageGrid();
        }
    }
    
    /**
     * 更新上传进度
     */
    function updateUploadProgress(percent) {
        uploadProgress.style.width = `${percent}%`;
    }
}); 