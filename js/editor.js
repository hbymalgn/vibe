// This file manages the editor's functionality, including loading templates and handling user interactions with the canvas.

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('design-canvas');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    // Tool selection
    const toolButtons = document.querySelectorAll('.tool-btn');
    const panelContents = document.querySelectorAll('.panel-content[data-tool]');
    const panelTitle = document.getElementById('panelTitle');
    
    const toolNames = {
        'select': '선택 도구',
        'text': '텍스트 도구',
        'image': '이미지 도구',
        'shape': '도형 도구',
        'draw': '그리기 도구'
    };

    // Initialize tool selection
    function initToolSelection() {
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.getAttribute('data-tool');
                selectTool(tool);
            });
        });
    }

    function selectTool(tool) {
        currentTool = tool;
        
        // Update tool buttons
        toolButtons.forEach(btn => {
            if (btn.getAttribute('data-tool') === tool) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update panel contents
        panelContents.forEach(panel => {
            if (panel.getAttribute('data-tool') === tool) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Update panel title
        if (panelTitle && toolNames[tool]) {
            panelTitle.textContent = toolNames[tool];
        }

        // Update canvas cursor
        if (canvas) {
            if (tool === 'text') {
                canvas.style.cursor = 'text';
            } else if (tool === 'select') {
                canvas.style.cursor = 'default';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        }
    }

    // Initialize tool selection on page load
    initToolSelection();

    // Zoom controls
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomLevelSpan = document.getElementById('zoomLevel');
    const canvasWrapper = document.getElementById('canvasWrapper');
    const canvasArea = document.querySelector('.canvas-area');
    
    let currentZoom = 0.7; // 기본 배율 70%
    const minZoom = 0.25;
    const maxZoom = 3.0;
    const zoomStep = 0.1;

    function updateZoom(zoom) {
        currentZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
        if (canvasWrapper) {
            canvasWrapper.style.transform = `scale(${currentZoom})`;
        }
        if (zoomLevelSpan) {
            zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;
        }
        
        // 줌 레벨에 따라 스크롤 제어
        // 70% 이하일 때는 스크롤 없음, 그 이상일 때는 스크롤 가능
        if (canvasArea) {
            if (currentZoom <= 0.7) {
                canvasArea.style.overflow = 'hidden';
            } else {
                canvasArea.style.overflow = 'auto';
            }
        }
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            updateZoom(currentZoom + zoomStep);
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            updateZoom(currentZoom - zoomStep);
        });
    }

    // Initialize zoom to 70%
    updateZoom(0.7);

    // Grid toggle
    const gridToggleBtn = document.getElementById('gridToggle');
    const gridOverlay = document.getElementById('gridOverlay');
    let gridVisible = false;
    const gridSize = 20; // 그리드 크기 (픽셀)
    const snapThreshold = 10; // 스냅 임계값 (픽셀)

    if (gridToggleBtn && gridOverlay) {
        gridToggleBtn.addEventListener('click', () => {
            gridVisible = !gridVisible;
            if (gridVisible) {
                gridOverlay.classList.add('show');
                gridToggleBtn.classList.add('active');
            } else {
                gridOverlay.classList.remove('show');
                gridToggleBtn.classList.remove('active');
            }
        });

        // Keyboard shortcut (G key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'g' || e.key === 'G') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    gridToggleBtn.click();
                }
            }
        });
    }

    // Smart guides (PowerPoint style)
    let activeGuides = { horizontal: null, vertical: null };
    const guideThreshold = 10; // 가이드 스냅 임계값
    
    function createGuideLine(type, position) {
        const guide = document.createElement('div');
        guide.className = `smart-guide ${type}`;
        guide.style.position = 'absolute';
        guide.style.backgroundColor = '#8B5CF6';
        guide.style.opacity = '0.8';
        guide.style.zIndex = '9999';
        guide.style.pointerEvents = 'none';
        
        if (type === 'horizontal') {
            guide.style.left = '0';
            guide.style.right = '0';
            guide.style.height = '1px';
            guide.style.top = `${position}px`;
        } else {
            guide.style.top = '0';
            guide.style.bottom = '0';
            guide.style.width = '1px';
            guide.style.left = `${position}px`;
        }
        
        return guide;
    }
    
    function showGuide(type, position) {
        hideGuides();
        const guide = createGuideLine(type, position);
        canvasWrapper.appendChild(guide);
        activeGuides[type] = guide;
    }
    
    function hideGuides() {
        if (activeGuides.horizontal) {
            activeGuides.horizontal.remove();
            activeGuides.horizontal = null;
        }
        if (activeGuides.vertical) {
            activeGuides.vertical.remove();
            activeGuides.vertical = null;
        }
    }
    
    // Smart snap function (PowerPoint style)
    function smartSnap(x, y, elementWidth = 0, elementHeight = 0) {
        const canvasRect = canvasWrapper.getBoundingClientRect();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // 캔버스 기준 위치 (줌 고려)
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        const canvasThirdX = canvasWidth / 3;
        const canvasThirdY = canvasHeight / 3;
        const canvasTwoThirdX = (canvasWidth * 2) / 3;
        const canvasTwoThirdY = (canvasHeight * 2) / 3;
        
        let snappedX = x;
        let snappedY = y;
        let guideX = null;
        let guideY = null;
        
        // 객체 중심점 기준
        const centerX = x + elementWidth / 2;
        const centerY = y + elementHeight / 2;
        
        // 가로 가이드 체크 (중앙, 1/3, 2/3)
        const horizontalSnapPoints = [
            { pos: canvasCenterY, label: 'center' },
            { pos: canvasThirdY, label: 'third' },
            { pos: canvasTwoThirdY, label: 'twoThird' }
        ];
        
        for (const point of horizontalSnapPoints) {
            const delta = Math.abs(centerY - point.pos);
            if (delta <= guideThreshold) {
                snappedY = point.pos - elementHeight / 2;
                guideY = point.pos;
                break;
            }
        }
        
        // 세로 가이드 체크 (중앙, 1/3, 2/3)
        const verticalSnapPoints = [
            { pos: canvasCenterX, label: 'center' },
            { pos: canvasThirdX, label: 'third' },
            { pos: canvasTwoThirdX, label: 'twoThird' }
        ];
        
        for (const point of verticalSnapPoints) {
            const delta = Math.abs(centerX - point.pos);
            if (delta <= guideThreshold) {
                snappedX = point.pos - elementWidth / 2;
                guideX = point.pos;
                break;
            }
        }
        
        // 가이드 표시
        if (guideX !== null || guideY !== null) {
            if (guideX !== null) {
                showGuide('vertical', guideX);
            }
            if (guideY !== null) {
                showGuide('horizontal', guideY);
            }
        } else {
            hideGuides();
        }
        
        return { x: snappedX, y: snappedY };
    }
    
    // Grid snap function
    function snapToGrid(x, y, snapMode = 'center') {
        if (!gridVisible) {
            return { x, y };
        }

        // 줌 레벨을 고려한 실제 그리드 크기
        const actualGridSize = gridSize * currentZoom;
        
        let snappedX = x;
        let snappedY = y;

        if (snapMode === 'center') {
            // 객체 중심점을 그리드에 맞춤
            snappedX = Math.round(x / actualGridSize) * actualGridSize;
            snappedY = Math.round(y / actualGridSize) * actualGridSize;
        } else if (snapMode === 'corner') {
            // 객체 모서리를 그리드에 맞춤
            snappedX = Math.round(x / actualGridSize) * actualGridSize;
            snappedY = Math.round(y / actualGridSize) * actualGridSize;
        } else if (snapMode === 'horizontal') {
            // 가로 라인에만 맞춤
            snappedY = Math.round(y / actualGridSize) * actualGridSize;
        } else if (snapMode === 'vertical') {
            // 세로 라인에만 맞춤
            snappedX = Math.round(x / actualGridSize) * actualGridSize;
        }

        // 스냅 거리가 임계값 이내일 때만 스냅 적용
        const deltaX = Math.abs(snappedX - x);
        const deltaY = Math.abs(snappedY - y);
        
        // 임계값을 넘으면 원래 위치 유지
        if (deltaX > snapThreshold) snappedX = x;
        if (deltaY > snapThreshold) snappedY = y;

        return { x: snappedX, y: snappedY };
    }
    
    // Grid snap for size (width/height)
    function snapSizeToGrid(size) {
        if (!gridVisible) {
            return size;
        }
        
        const actualGridSize = gridSize * currentZoom;
        const snappedSize = Math.round(size / actualGridSize) * actualGridSize;
        const delta = Math.abs(snappedSize - size);
        
        // 임계값 이내일 때만 스냅 적용
        return delta <= snapThreshold ? snappedSize : size;
    }

    // Text objects storage
    let textObjects = [];
    let currentTool = 'select';
    let isAddingText = false;
    let selectedObject = null;

    // Property panel elements
    const propertyPanel = document.getElementById('propertyPanel');
    const selectionInfo = document.getElementById('selectionInfo');
    const textPropertyGroup = document.getElementById('textPropertyGroup');
    const fontSizeGroup = document.getElementById('fontSizeGroup');
    const textStyleGroup = document.getElementById('textStyleGroup');
    const propText = document.getElementById('propText');
    const propFontSize = document.getElementById('propFontSize');
    const propColor = document.getElementById('propColor');
    const propX = document.getElementById('propX');
    const propY = document.getElementById('propY');
    const propWidth = document.getElementById('propWidth');
    const propHeight = document.getElementById('propHeight');
    const keepRatioCheckbox = document.getElementById('keepRatio');
    const ratioCheckboxGroup = document.getElementById('ratioCheckboxGroup');
    const deleteBtn = document.getElementById('deleteBtn');

    // Initialize canvas background
    ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text style items click handler
    const textStyleItems = document.querySelectorAll('.text-style-item');
    const objectsLayer = document.getElementById('objectsLayer');
    const fontFamilySelect = document.getElementById('fontFamily');
    
    // Image upload handler
    const imageUpload = document.getElementById('imageUpload');
    const sampleImages = document.querySelectorAll('.sample-image');
    
    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    addImageToCanvas(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Sample image click handler
    sampleImages.forEach(item => {
        item.addEventListener('click', () => {
            const imageSrc = item.getAttribute('data-src');
            if (imageSrc) {
                addImageToCanvas(imageSrc);
            }
        });
    });

    textStyleItems.forEach(item => {
        item.addEventListener('click', () => {
            const fontSize = parseInt(item.getAttribute('data-size')) || 18;
            const fontFamily = fontFamilySelect ? fontFamilySelect.value : 'Arial';
            let textType = '본문 텍스트';
            if (item.classList.contains('heading')) {
                textType = '제목';
            } else if (item.classList.contains('subheading')) {
                textType = '부제목';
            }
            addTextToCanvas(fontSize, fontFamily, textType);
        });
    });

    // Shape items click handler
    const shapeItems = document.querySelectorAll('.shape-item');
    const shapeColorGrid = document.getElementById('shapeColorGrid');
    let selectedShapeColor = '#8B5CF6';

    shapeItems.forEach(item => {
        item.addEventListener('click', () => {
            const shapeType = item.getAttribute('data-shape');
            addShapeToCanvas(shapeType, selectedShapeColor);
        });
    });

    // Shape color selection
    const shapeColorPicker = document.getElementById('shapeColorPicker');
    const shapeColorText = document.getElementById('shapeColorText');
    
    if (shapeColorPicker && shapeColorText) {
        // Color picker 변경 시
        shapeColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            shapeColorText.value = color.toUpperCase();
            selectedShapeColor = color;
        });
        
        // 텍스트 입력 변경 시
        shapeColorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                shapeColorPicker.value = color;
                selectedShapeColor = color;
            }
        });
    }
    
    if (shapeColorGrid) {
        const colorItems = shapeColorGrid.querySelectorAll('.color-item');
        colorItems.forEach(item => {
            item.addEventListener('click', () => {
                colorItems.forEach(ci => ci.classList.remove('selected'));
                item.classList.add('selected');
                const color = item.getAttribute('data-color') || '#8B5CF6';
                selectedShapeColor = color;
                // Color picker와 텍스트 필드도 업데이트
                if (shapeColorPicker) shapeColorPicker.value = color;
                if (shapeColorText) shapeColorText.value = color.toUpperCase();
            });
        });
    }

    function addTextToCanvas(fontSize, fontFamily, textType = '본문 텍스트') {
        isAddingText = true;
        currentTool = 'text';
        
        // Create text element
        const textDiv = document.createElement('div');
        textDiv.className = 'canvas-object text-object';
        textDiv.dataset.textType = textType;
        textDiv.style.position = 'absolute';
        textDiv.style.left = '50%';
        textDiv.style.top = '50%';
        textDiv.style.transform = 'translate(-50%, -50%)';
        textDiv.style.fontSize = `${fontSize}px`;
        textDiv.style.fontFamily = fontFamily;
        textDiv.style.color = '#000000';
        textDiv.style.cursor = 'text';
        textDiv.style.minWidth = '100px';
        textDiv.style.minHeight = '20px';
        textDiv.style.padding = '4px';
        textDiv.contentEditable = 'true'; // 새로 추가되는 텍스트는 바로 편집 가능
        textDiv.textContent = '텍스트를 입력하세요';
        
        // Add to objects layer
        if (objectsLayer) {
            objectsLayer.appendChild(textDiv);
            
            // Focus and select text
            setTimeout(() => {
                textDiv.focus();
                const range = document.createRange();
                range.selectNodeContents(textDiv);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }, 10);
        }

        // Make text draggable
        makeDraggable(textDiv);
        
        // Update layers
        updateLayers();
        
        // 텍스트 추가 후 선택 도구로 전환하여 바로 이동/편집 가능하도록
        setTimeout(() => {
            isAddingText = false;
            // 편집이 끝나면 contentEditable을 false로 변경
            textDiv.addEventListener('blur', () => {
                textDiv.contentEditable = 'false';
                textDiv.style.cursor = 'default';
                // 편집 종료 후 선택 도구로 전환
                selectTool('select');
                selectObject(textDiv);
                updateLayers();
                saveState(); // 히스토리 저장
            }, { once: true });
        }, 100);
    }

    // Layers management
    const layersList = document.getElementById('layersList');
    
    function updateLayers() {
        if (!layersList) return;
        
        // Clear existing layers (except background)
        const backgroundLayer = layersList.querySelector('[data-id="background"]');
        layersList.innerHTML = '';
        if (backgroundLayer) {
            layersList.appendChild(backgroundLayer);
        }
        
        // Add all objects to layers
        if (objectsLayer) {
            const objects = Array.from(objectsLayer.children);
            objects.forEach((obj, index) => {
                const layerItem = createLayerItem(obj, index);
                layersList.appendChild(layerItem);
            });
        }
    }
    
    function createLayerItem(element, index) {
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.dataset.objectIndex = index;
        
        let icon = '📄';
        let title = '요소';
        let subtitle = '';
        
        if (element.classList.contains('text-object')) {
            icon = 'T';
            title = element.dataset.textType || '텍스트';
            subtitle = element.textContent || '텍스트';
            if (subtitle.length > 20) subtitle = subtitle.substring(0, 20) + '...';
        } else if (element.classList.contains('image-object')) {
            icon = '🖼️';
            title = '이미지';
            subtitle = '이미지';
        } else if (element.classList.contains('shape-object')) {
            icon = '⬜';
            title = '도형';
            const shapeType = element.dataset.shapeType;
            const shapeNames = {
                'rect': '사각형',
                'circle': '원',
                'triangle': '삼각형',
                'star': '별',
                'diamond': '다이아몬드',
                'heart': '하트'
            };
            subtitle = shapeNames[shapeType] || '도형';
        }
        
        layerItem.innerHTML = `
            <div class="layer-icon">${icon}</div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                <span class="layer-name">${title}</span>
                <span style="font-size: 0.7rem; color: #666;">${subtitle}</span>
            </div>
        `;
        
        // Click to select
        layerItem.addEventListener('click', () => {
            selectObject(element);
        });
        
        // Update selected state
        if (selectedObject === element) {
            layerItem.classList.add('selected');
        }
        
        return layerItem;
    }
    
    function selectObject(element) {
        // Deselect previous object
        if (selectedObject && selectedObject !== element) {
            selectedObject.classList.remove('selected');
            removeResizeHandles(selectedObject);
        }
        
        selectedObject = element;
        element.classList.add('selected');
        
        // Update layers
        updateLayers();
        
        // Show property panel
        if (propertyPanel) {
            propertyPanel.style.display = 'block';
        }
        if (selectionInfo) {
            selectionInfo.style.display = 'none';
        }
        
        // If it's a text object, show text properties
        if (element.classList.contains('text-object')) {
            if (textPropertyGroup) textPropertyGroup.style.display = 'block';
            if (fontSizeGroup) fontSizeGroup.style.display = 'block';
            if (textStyleGroup) textStyleGroup.style.display = 'block';
            if (ratioCheckboxGroup) ratioCheckboxGroup.style.display = 'none';
            
            // Update property values
            if (propText) {
                propText.value = element.textContent;
            }
            if (propFontSize) {
                const fontSize = parseInt(element.style.fontSize) || 18;
                propFontSize.value = fontSize;
            }
            if (propColor) {
                const color = element.style.color || '#000000';
                propColor.value = rgbToHex(color);
            }
        }
        
        // If it's an image object, show image properties
        if (element.classList.contains('image-object')) {
            if (textPropertyGroup) textPropertyGroup.style.display = 'none';
            if (fontSizeGroup) fontSizeGroup.style.display = 'none';
            if (textStyleGroup) textStyleGroup.style.display = 'none';
            if (ratioCheckboxGroup) ratioCheckboxGroup.style.display = 'flex';
            
            // Add resize handles
            addResizeHandles(element);
            
            // Update property values
            const rect = element.getBoundingClientRect();
            const canvasRect = canvasWrapper.getBoundingClientRect();
            const x = rect.left - canvasRect.left;
            const y = rect.top - canvasRect.top;
            
            if (propX) propX.value = Math.round(x);
            if (propY) propY.value = Math.round(y);
            if (propWidth) propWidth.value = Math.round(element.offsetWidth);
            if (propHeight) propHeight.value = Math.round(element.offsetHeight);
            if (keepRatioCheckbox) {
                keepRatioCheckbox.checked = element.dataset.keepRatio !== 'false';
            }
        }
        
        // If it's a shape object, show shape properties
        if (element.classList.contains('shape-object')) {
            if (textPropertyGroup) textPropertyGroup.style.display = 'none';
            if (fontSizeGroup) fontSizeGroup.style.display = 'none';
            if (textStyleGroup) textStyleGroup.style.display = 'none';
            if (ratioCheckboxGroup) ratioCheckboxGroup.style.display = 'flex';
            
            // Add resize handles
            addResizeHandles(element);
            
            // Update property values
            const rect = element.getBoundingClientRect();
            const canvasRect = canvasWrapper.getBoundingClientRect();
            const x = rect.left - canvasRect.left;
            const y = rect.top - canvasRect.top;
            
            if (propX) propX.value = Math.round(x);
            if (propY) propY.value = Math.round(y);
            if (propWidth) propWidth.value = Math.round(element.offsetWidth);
            if (propHeight) propHeight.value = Math.round(element.offsetHeight);
            if (propColor) {
                const shapeSvg = element.querySelector('svg');
                if (shapeSvg) {
                    const path = shapeSvg.querySelector('path, rect, circle, polygon');
                    if (path) {
                        const fill = path.getAttribute('fill') || path.style.fill;
                        if (fill) propColor.value = fill;
                    }
                }
            }
            if (keepRatioCheckbox) {
                keepRatioCheckbox.checked = element.dataset.keepRatio !== 'false';
            }
        }
    }

    function deselectObject() {
        if (selectedObject) {
            selectedObject.classList.remove('selected');
            removeResizeHandles(selectedObject);
            selectedObject = null;
        }
        
        if (propertyPanel) {
            propertyPanel.style.display = 'none';
        }
        if (selectionInfo) {
            selectionInfo.style.display = 'block';
        }
        
        if (textPropertyGroup) textPropertyGroup.style.display = 'none';
        if (fontSizeGroup) fontSizeGroup.style.display = 'none';
        if (textStyleGroup) textStyleGroup.style.display = 'none';
        if (ratioCheckboxGroup) ratioCheckboxGroup.style.display = 'none';
    }
    
    function addImageToCanvas(imageSrc) {
        const img = new Image();
        img.onload = () => {
            // Calculate initial size (max 400px width or height)
            let width = img.width;
            let height = img.height;
            const maxSize = 400;
            
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = width * ratio;
                height = height * ratio;
            }
            
            // Create image element
            const imageDiv = document.createElement('div');
            imageDiv.className = 'canvas-object image-object';
            imageDiv.style.position = 'absolute';
            imageDiv.style.left = '50%';
            imageDiv.style.top = '50%';
            imageDiv.style.transform = 'translate(-50%, -50%)';
            imageDiv.style.width = `${width}px`;
            imageDiv.style.height = `${height}px`;
            imageDiv.style.cursor = 'move';
            imageDiv.dataset.keepRatio = 'true';
            imageDiv.dataset.originalWidth = width;
            imageDiv.dataset.originalHeight = height;
            
            const imgElement = document.createElement('img');
            imgElement.src = imageSrc;
            imgElement.style.width = '100%';
            imgElement.style.height = '100%';
            imgElement.style.objectFit = 'contain';
            imgElement.draggable = false;
            
            imageDiv.appendChild(imgElement);
            
            if (objectsLayer) {
                objectsLayer.appendChild(imageDiv);
            }
            
            makeDraggable(imageDiv);
            // Update layers
            updateLayers();
            saveState(); // 히스토리 저장
            // 이미지 추가 후 선택 도구로 전환하여 바로 이동/편집 가능하도록
            selectTool('select');
            selectObject(imageDiv);
        };
        img.src = imageSrc;
    }
    
    function addShapeToCanvas(shapeType, color) {
        const size = 200; // 기본 크기
        
        // Create shape element
        const shapeDiv = document.createElement('div');
        shapeDiv.className = 'canvas-object shape-object';
        shapeDiv.style.position = 'absolute';
        shapeDiv.style.left = '50%';
        shapeDiv.style.top = '50%';
        shapeDiv.style.transform = 'translate(-50%, -50%)';
        shapeDiv.style.width = `${size}px`;
        shapeDiv.style.height = `${size}px`;
        shapeDiv.style.cursor = 'move';
        shapeDiv.dataset.keepRatio = 'true';
        shapeDiv.dataset.originalWidth = size;
        shapeDiv.dataset.originalHeight = size;
        shapeDiv.dataset.shapeType = shapeType;
        
        // Create SVG for shape
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.style.display = 'block';
        
        let shapeElement;
        switch(shapeType) {
            case 'rect':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shapeElement.setAttribute('x', '10');
                shapeElement.setAttribute('y', '10');
                shapeElement.setAttribute('width', '80');
                shapeElement.setAttribute('height', '80');
                shapeElement.setAttribute('fill', color);
                break;
            case 'circle':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                shapeElement.setAttribute('cx', '50');
                shapeElement.setAttribute('cy', '50');
                shapeElement.setAttribute('r', '40');
                shapeElement.setAttribute('fill', color);
                break;
            case 'triangle':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shapeElement.setAttribute('points', '50,10 90,90 10,90');
                shapeElement.setAttribute('fill', color);
                break;
            case 'star':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shapeElement.setAttribute('points', '50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35');
                shapeElement.setAttribute('fill', color);
                break;
            case 'diamond':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shapeElement.setAttribute('points', '50,10 90,50 50,90 10,50');
                shapeElement.setAttribute('fill', color);
                break;
            case 'heart':
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                shapeElement.setAttribute('d', 'M50,85 C50,85 10,50 10,30 C10,20 18,12 28,12 C35,12 40,16 43,20 C46,16 51,12 58,12 C68,12 76,20 76,30 C76,50 40,85 40,85 C40,85 50,85 50,85 Z');
                shapeElement.setAttribute('fill', color);
                shapeElement.setAttribute('transform', 'scale(0.8) translate(6, 6)');
                break;
            default:
                shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shapeElement.setAttribute('x', '10');
                shapeElement.setAttribute('y', '10');
                shapeElement.setAttribute('width', '80');
                shapeElement.setAttribute('height', '80');
                shapeElement.setAttribute('fill', color);
        }
        
        svg.appendChild(shapeElement);
        shapeDiv.appendChild(svg);
        
        if (objectsLayer) {
            objectsLayer.appendChild(shapeDiv);
        }
        
        makeDraggable(shapeDiv);
        // Update layers
        updateLayers();
        saveState(); // 히스토리 저장
        // 도형 추가 후 선택 도구로 전환하여 바로 이동/편집 가능하도록
        selectTool('select');
        selectObject(shapeDiv);
    }
    
    function addResizeHandles(element) {
        // Remove existing handles
        removeResizeHandles(element);
        
        if (!element.classList.contains('image-object') && !element.classList.contains('shape-object')) return;
        
        const handles = ['nw', 'ne', 'sw', 'se'];
        handles.forEach(handle => {
            const handleDiv = document.createElement('div');
            handleDiv.className = `resize-handle ${handle}`;
            handleDiv.style.position = 'absolute';
            handleDiv.style.width = '10px';
            handleDiv.style.height = '10px';
            handleDiv.style.background = 'white';
            handleDiv.style.border = '2px solid #8B5CF6';
            handleDiv.style.borderRadius = '2px';
            handleDiv.style.cursor = `${handle}-resize`;
            handleDiv.style.zIndex = '1000';
            
            // Position handles
            if (handle === 'nw') {
                handleDiv.style.top = '-5px';
                handleDiv.style.left = '-5px';
            } else if (handle === 'ne') {
                handleDiv.style.top = '-5px';
                handleDiv.style.right = '-5px';
            } else if (handle === 'sw') {
                handleDiv.style.bottom = '-5px';
                handleDiv.style.left = '-5px';
            } else if (handle === 'se') {
                handleDiv.style.bottom = '-5px';
                handleDiv.style.right = '-5px';
            }
            
            element.appendChild(handleDiv);
            makeResizable(element, handleDiv, handle);
        });
    }
    
    function removeResizeHandles(element) {
        if (!element) return;
        const handles = element.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.remove());
    }
    
    function makeResizable(element, handle, direction) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        let aspectRatio;
        
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            
            const rect = element.getBoundingClientRect();
            const canvasRect = canvasWrapper.getBoundingClientRect();
            
            startX = e.clientX;
            startY = e.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            startLeft = rect.left - canvasRect.left;
            startTop = rect.top - canvasRect.top;
            
            const keepRatio = element.dataset.keepRatio !== 'false';
            if (keepRatio) {
                aspectRatio = startWidth / startHeight;
            }
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const keepRatio = element.dataset.keepRatio !== 'false';
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            if (direction === 'se') {
                newWidth = startWidth + deltaX;
                if (keepRatio) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newHeight = startHeight + deltaY;
                }
            } else if (direction === 'sw') {
                newWidth = startWidth - deltaX;
                if (keepRatio) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newHeight = startHeight + deltaY;
                }
                newLeft = startLeft + deltaX;
            } else if (direction === 'ne') {
                newWidth = startWidth + deltaX;
                if (keepRatio) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newHeight = startHeight - deltaY;
                }
                newTop = startTop + deltaY;
            } else if (direction === 'nw') {
                newWidth = startWidth - deltaX;
                if (keepRatio) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newHeight = startHeight - deltaY;
                }
                newLeft = startLeft + deltaX;
                newTop = startTop + deltaY;
            }
            
            // Minimum size
            if (newWidth < 50) newWidth = 50;
            if (newHeight < 50) newHeight = 50;
            
            if (keepRatio && direction === 'sw') {
                newHeight = newWidth / aspectRatio;
            } else if (keepRatio && direction === 'nw') {
                newHeight = newWidth / aspectRatio;
            }
            
            // Apply grid snap to size and position if grid is visible
            if (gridVisible && !e.shiftKey) {
                newWidth = snapSizeToGrid(newWidth);
                newHeight = snapSizeToGrid(newHeight);
                
                // 위치도 그리드에 맞춤
                const snappedPos = snapToGrid(newLeft, newTop, 'corner');
                newLeft = snappedPos.x;
                newTop = snappedPos.y;
            }
            
            element.style.width = `${newWidth}px`;
            element.style.height = `${newHeight}px`;
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
            element.style.transform = 'none';
            
            // Update property panel
            if (selectedObject === element) {
                if (propWidth) propWidth.value = Math.round(newWidth);
                if (propHeight) propHeight.value = Math.round(newHeight);
                if (propX) propX.value = Math.round(newLeft);
                if (propY) propY.value = Math.round(newTop);
            }
        }
        
        function onMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveState(); // 리사이즈 완료 시 히스토리 저장
        }
    }

    function rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
        return '#000000';
    }

    function makeDraggable(element) {
        let isDragging = false;
        let isEditing = false;
        let startX, startY;
        let startLeft, startTop;
        let hasMoved = false;
        const dragThreshold = 5; // 픽셀 이동 거리 임계값

        // Double click to edit (텍스트 객체만)
        if (element.classList.contains('text-object')) {
            element.addEventListener('dblclick', (e) => {
                if (currentTool === 'select' && !isDragging && !hasMoved) {
                    e.stopPropagation();
                    e.preventDefault();
                    isEditing = true;
                    element.contentEditable = 'true';
                    element.style.cursor = 'text';
                    element.focus();
                    
                    const range = document.createRange();
                    range.selectNodeContents(element);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            });

            // Stop editing when focus is lost
            element.addEventListener('blur', () => {
                isEditing = false;
                element.contentEditable = 'false'; // 편집 모드 종료
                element.style.cursor = 'default';
                if (propText && selectedObject === element) {
                    propText.value = element.textContent;
                }
            });
            
        }

        element.addEventListener('mousedown', (e) => {
            // Don't start dragging if clicking on resize handle
            if (e.target.classList.contains('resize-handle')) {
                return;
            }
            
            // Don't start dragging if editing text
            if (isEditing) {
                return;
            }
            
            // 텍스트 객체의 경우 contentEditable이 true이면 편집 모드로 들어가지 않도록 방지
            if (element.classList.contains('text-object') && element.contentEditable === 'true' && !isEditing) {
                // 편집 모드가 아닐 때는 contentEditable을 false로 설정하여 클릭 시 편집 방지
                e.preventDefault();
                e.stopPropagation();
                element.contentEditable = 'false';
                element.style.cursor = 'default';
            }
            
            if (currentTool === 'select' && !isAddingText) {
                e.stopPropagation();
                
                // Get initial mouse position
                startX = e.clientX;
                startY = e.clientY;
                hasMoved = false;
                
                // Get current element position
                const rect = element.getBoundingClientRect();
                const canvasRect = canvasWrapper.getBoundingClientRect();
                startLeft = rect.left - canvasRect.left;
                startTop = rect.top - canvasRect.top;
                
                // Select object immediately on click
                selectObject(element);
                
                // Set up mouse move and up listeners
                const onMouseMove = (e) => {
                    const deltaX = Math.abs(e.clientX - startX);
                    const deltaY = Math.abs(e.clientY - startY);
                    
                    // Check if mouse has moved enough to be considered a drag
                    if (deltaX > dragThreshold || deltaY > dragThreshold) {
                        hasMoved = true;
                        if (!isDragging) {
                            isDragging = true;
                            element.style.cursor = 'move';
                        }
                        
                        // Calculate new position
                        const canvasRect = canvasWrapper.getBoundingClientRect();
                        let newX = e.clientX - canvasRect.left;
                        let newY = e.clientY - canvasRect.top;
                        
                        // Shift 키를 누르고 있으면 스냅 비활성화
                        if (!e.shiftKey) {
                            // 먼저 스마트 가이드 스냅 적용 (PowerPoint style)
                            const elementWidth = element.offsetWidth || 0;
                            const elementHeight = element.offsetHeight || 0;
                            const smartSnapped = smartSnap(newX, newY, elementWidth, elementHeight);
                            newX = smartSnapped.x;
                            newY = smartSnapped.y;
                            
                            // 그리드가 활성화되어 있으면 그리드 스냅도 적용
                            if (gridVisible) {
                                const snapMode = e.ctrlKey ? 'corner' : 'center';
                                const gridSnapped = snapToGrid(newX, newY, snapMode);
                                // 스마트 가이드와 그리드 중 더 가까운 것 선택
                                const smartDelta = Math.abs(smartSnapped.x - (e.clientX - canvasRect.left)) + Math.abs(smartSnapped.y - (e.clientY - canvasRect.top));
                                const gridDelta = Math.abs(gridSnapped.x - (e.clientX - canvasRect.left)) + Math.abs(gridSnapped.y - (e.clientY - canvasRect.top));
                                
                                if (gridDelta < smartDelta) {
                                    newX = gridSnapped.x;
                                    newY = gridSnapped.y;
                                    hideGuides(); // 그리드 스냅 사용 시 가이드 숨김
                                }
                            }
                        } else {
                            hideGuides(); // Shift 키 누르면 가이드 숨김
                        }
                        
                        element.style.left = `${newX}px`;
                        element.style.top = `${newY}px`;
                        element.style.transform = 'none';
                        
                        // Update property panel if selected
                        if (selectedObject === element) {
                            if (propX) propX.value = Math.round(newX);
                            if (propY) propY.value = Math.round(newY);
                        }
                    }
                };
                
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    
                    // 가이드 숨기기
                    hideGuides();
                    
                    if (isDragging) {
                        isDragging = false;
                        if (!isEditing) {
                            if (element.classList.contains('text-object')) {
                                element.style.cursor = 'text';
                            } else {
                                element.style.cursor = 'move';
                            }
                        }
                    }
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        });
    }

    // Canvas click handler for text tool
    // 텍스트는 텍스트 스타일 아이템(제목/부제목/본문)을 클릭했을 때만 추가됨
    // 캔버스를 직접 클릭해도 텍스트가 추가되지 않음
    function onCanvasClick(event) {
        // 텍스트 도구에서 캔버스 클릭 시 자동으로 텍스트를 추가하지 않음
        // 텍스트는 텍스트 스타일 아이템을 클릭했을 때만 추가됨
    }

    // Property panel event listeners
    if (propText) {
        propText.addEventListener('input', (e) => {
            if (selectedObject && selectedObject.classList.contains('text-object')) {
                selectedObject.textContent = e.target.value;
                updateLayers();
            }
        });
    }

    if (propFontSize) {
        propFontSize.addEventListener('input', (e) => {
            if (selectedObject && selectedObject.classList.contains('text-object')) {
                const size = parseInt(e.target.value) || 18;
                selectedObject.style.fontSize = `${size}px`;
            }
        });
    }

    if (propColor) {
        propColor.addEventListener('input', (e) => {
            if (selectedObject && selectedObject.classList.contains('text-object')) {
                selectedObject.style.color = e.target.value;
            } else if (selectedObject && selectedObject.classList.contains('shape-object')) {
                const shapeSvg = selectedObject.querySelector('svg');
                if (shapeSvg) {
                    const path = shapeSvg.querySelector('path, rect, circle, polygon');
                    if (path) {
                        path.setAttribute('fill', e.target.value);
                    }
                }
            }
        });
    }

    // Image and Shape property listeners
    if (propX) {
        propX.addEventListener('input', (e) => {
            if (selectedObject && (selectedObject.classList.contains('image-object') || selectedObject.classList.contains('shape-object'))) {
                selectedObject.style.left = `${e.target.value}px`;
                selectedObject.style.transform = 'none';
            }
        });
    }

    if (propY) {
        propY.addEventListener('input', (e) => {
            if (selectedObject && (selectedObject.classList.contains('image-object') || selectedObject.classList.contains('shape-object'))) {
                selectedObject.style.top = `${e.target.value}px`;
                selectedObject.style.transform = 'none';
            }
        });
    }

    if (propWidth) {
        propWidth.addEventListener('input', (e) => {
            if (selectedObject && (selectedObject.classList.contains('image-object') || selectedObject.classList.contains('shape-object'))) {
                const width = parseInt(e.target.value) || 100;
                const keepRatio = selectedObject.dataset.keepRatio !== 'false';
                
                if (keepRatio && selectedObject.dataset.originalWidth) {
                    const aspectRatio = selectedObject.dataset.originalWidth / selectedObject.dataset.originalHeight;
                    const height = width / aspectRatio;
                    selectedObject.style.width = `${width}px`;
                    selectedObject.style.height = `${height}px`;
                    if (propHeight) propHeight.value = Math.round(height);
                } else {
                    selectedObject.style.width = `${width}px`;
                }
                
                // Update resize handles
                removeResizeHandles(selectedObject);
                addResizeHandles(selectedObject);
            }
        });
    }

    if (propHeight) {
        propHeight.addEventListener('input', (e) => {
            if (selectedObject && (selectedObject.classList.contains('image-object') || selectedObject.classList.contains('shape-object'))) {
                const height = parseInt(e.target.value) || 100;
                const keepRatio = selectedObject.dataset.keepRatio !== 'false';
                
                if (keepRatio && selectedObject.dataset.originalWidth) {
                    const aspectRatio = selectedObject.dataset.originalWidth / selectedObject.dataset.originalHeight;
                    const width = height * aspectRatio;
                    selectedObject.style.width = `${width}px`;
                    selectedObject.style.height = `${height}px`;
                    if (propWidth) propWidth.value = Math.round(width);
                } else {
                    selectedObject.style.height = `${height}px`;
                }
                
                // Update resize handles
                removeResizeHandles(selectedObject);
                addResizeHandles(selectedObject);
            }
        });
    }

    if (keepRatioCheckbox) {
        keepRatioCheckbox.addEventListener('change', (e) => {
            if (selectedObject && (selectedObject.classList.contains('image-object') || selectedObject.classList.contains('shape-object'))) {
                selectedObject.dataset.keepRatio = e.target.checked ? 'true' : 'false';
            }
        });
    }

    // Shape color property listener
    if (propColor) {
        propColor.addEventListener('input', (e) => {
            if (selectedObject && selectedObject.classList.contains('shape-object')) {
                const shapeSvg = selectedObject.querySelector('svg');
                if (shapeSvg) {
                    const path = shapeSvg.querySelector('path, rect, circle, polygon');
                    if (path) {
                        path.setAttribute('fill', e.target.value);
                    }
                }
            }
        });
    }

    function deleteSelectedObject() {
        if (selectedObject) {
            selectedObject.remove();
            deselectObject();
            updateLayers();
            saveState(); // 히스토리 저장
        }
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteSelectedObject);
    }

    // Keyboard delete handler (Backspace key)
    document.addEventListener('keydown', (e) => {
        // 입력 필드에 포커스가 있으면 삭제하지 않음
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
            return;
        }
        
        // Backspace 또는 Delete 키로 선택된 객체 삭제
        if ((e.key === 'Backspace' || e.key === 'Delete') && selectedObject) {
            e.preventDefault();
            deleteSelectedObject();
        }
    });

    // Click on canvas to deselect
    canvasWrapper.addEventListener('click', (e) => {
        if (e.target === canvasWrapper || e.target === canvas) {
            if (currentTool === 'select') {
                deselectObject();
            }
        }
    });

    // Drawing functionality
    let isDrawing = false;
    let brushSize = 5;
    let brushColor = '#000000';
    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const brushColorGrid = document.getElementById('brushColorGrid');
    const clearDrawingBtn = document.getElementById('clearDrawing');

    // Brush size handler
    if (brushSizeInput && brushSizeValue) {
        brushSizeInput.addEventListener('input', (e) => {
            brushSize = parseInt(e.target.value);
            brushSizeValue.textContent = `${brushSize}px`;
        });
    }

    // Brush color handler
    const brushColorPicker = document.getElementById('brushColorPicker');
    const brushColorText = document.getElementById('brushColorText');
    
    if (brushColorPicker && brushColorText) {
        // Color picker 변경 시
        brushColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            brushColorText.value = color.toUpperCase();
            brushColor = color;
        });
        
        // 텍스트 입력 변경 시
        brushColorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                brushColorPicker.value = color;
                brushColor = color;
            }
        });
    }
    
    if (brushColorGrid) {
        const colorItems = brushColorGrid.querySelectorAll('.color-item');
        colorItems.forEach(item => {
            item.addEventListener('click', () => {
                colorItems.forEach(ci => ci.classList.remove('selected'));
                item.classList.add('selected');
                const color = item.getAttribute('data-color') || '#000000';
                brushColor = color;
                // Color picker와 텍스트 필드도 업데이트
                if (brushColorPicker) brushColorPicker.value = color;
                if (brushColorText) brushColorText.value = color.toUpperCase();
            });
        });
    }

    // Clear drawing handler
    if (clearDrawingBtn) {
        clearDrawingBtn.addEventListener('click', () => {
            // Clear only the drawing layer (keep background)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
    }

    // Drawing event handlers
    function startDrawing(e) {
        if (currentTool === 'draw') {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const canvasRect = canvasWrapper.getBoundingClientRect();
            const x = (e.clientX - canvasRect.left) / currentZoom;
            const y = (e.clientY - canvasRect.top) / currentZoom;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    }

    function draw(e) {
        if (!isDrawing || currentTool !== 'draw') return;
        
        const rect = canvas.getBoundingClientRect();
        const canvasRect = canvasWrapper.getBoundingClientRect();
        const x = (e.clientX - canvasRect.left) / currentZoom;
        const y = (e.clientY - canvasRect.top) / currentZoom;
        
        ctx.lineTo(x, y);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
        }
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Right panel tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const panelToggle = document.getElementById('panelToggle');
    const rightPanel = document.getElementById('rightPanel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Update tab buttons
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update tab contents
            tabContents.forEach(content => {
                if (content.id === `${targetTab}Tab`) {
                    content.style.display = 'block';
                    content.classList.add('active');
                } else {
                    content.style.display = 'none';
                    content.classList.remove('active');
                }
            });
        });
    });

    // Panel toggle
    if (panelToggle && rightPanel) {
        panelToggle.addEventListener('click', () => {
            rightPanel.classList.toggle('collapsed');
            panelToggle.textContent = rightPanel.classList.contains('collapsed') ? '‹' : '›';
        });
    }

    // Canvas background settings
    const transparentBgCheckbox = document.getElementById('transparentBg');
    const canvasBgColor = document.getElementById('canvasBgColor');
    const canvasBgColorText = document.getElementById('canvasBgColorText');

    if (transparentBgCheckbox) {
        transparentBgCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // 배경 없음 선택 시 배경색 입력 비활성화
                if (canvasBgColor) canvasBgColor.disabled = true;
                if (canvasBgColorText) canvasBgColorText.disabled = true;
                // 캔버스 배경 투명하게
                if (canvasWrapper) {
                    canvasWrapper.style.background = 'transparent';
                }
                // 캔버스 배경도 투명하게 (하지만 canvas는 투명을 지원하지 않으므로 체크무늬 패턴 사용)
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                // 배경색 선택 활성화
                if (canvasBgColor) canvasBgColor.disabled = false;
                if (canvasBgColorText) canvasBgColorText.disabled = false;
                // 선택된 배경색 적용
                const bgColor = canvasBgColor ? canvasBgColor.value : '#FFFFFF';
                if (canvasWrapper) {
                    canvasWrapper.style.background = bgColor;
                }
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        });
    }

    if (canvasBgColor && canvasBgColorText) {
        canvasBgColor.addEventListener('input', (e) => {
            const color = e.target.value;
            canvasBgColorText.value = color.toUpperCase();
            if (!transparentBgCheckbox || !transparentBgCheckbox.checked) {
                if (canvasWrapper) {
                    canvasWrapper.style.background = color;
                }
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        });

        canvasBgColorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                canvasBgColor.value = color;
                if (!transparentBgCheckbox || !transparentBgCheckbox.checked) {
                    if (canvasWrapper) {
                        canvasWrapper.style.background = color;
                    }
                    ctx.fillStyle = color;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }
        });
    }

    // Undo/Redo functionality
    let history = [];
    let historyIndex = -1;
    const maxHistory = 50;

    function saveState() {
        // 현재 상태를 히스토리에 저장
        const state = {
            objects: Array.from(objectsLayer.children).map(child => {
                const rect = child.getBoundingClientRect();
                const canvasRect = canvasWrapper.getBoundingClientRect();
                return {
                    type: child.classList.contains('text-object') ? 'text' : 
                          child.classList.contains('image-object') ? 'image' : 'shape',
                    element: child.cloneNode(true),
                    x: rect.left - canvasRect.left,
                    y: rect.top - canvasRect.top
                };
            })
        };
        
        // 현재 인덱스 이후의 히스토리 제거
        history = history.slice(0, historyIndex + 1);
        history.push(state);
        
        // 최대 히스토리 수 제한
        if (history.length > maxHistory) {
            history.shift();
        } else {
            historyIndex++;
        }
        
        updateUndoRedoButtons();
    }

    function restoreState(state) {
        // 모든 객체 제거
        while (objectsLayer.firstChild) {
            objectsLayer.removeChild(objectsLayer.firstChild);
        }
        
        // 상태 복원
        state.objects.forEach(obj => {
            const element = obj.element.cloneNode(true);
            element.style.position = 'absolute';
            element.style.left = `${obj.x}px`;
            element.style.top = `${obj.y}px`;
            objectsLayer.appendChild(element);
            
            // 이벤트 리스너 다시 연결
            if (element.classList.contains('text-object')) {
                makeDraggable(element);
            } else if (element.classList.contains('image-object') || element.classList.contains('shape-object')) {
                makeDraggable(element);
            }
        });
        
        updateLayers();
    }

    function updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = historyIndex <= 0;
            undoBtn.style.opacity = historyIndex <= 0 ? '0.5' : '1';
            undoBtn.style.cursor = historyIndex <= 0 ? 'not-allowed' : 'pointer';
        }
        if (redoBtn) {
            redoBtn.disabled = historyIndex >= history.length - 1;
            redoBtn.style.opacity = historyIndex >= history.length - 1 ? '0.5' : '1';
            redoBtn.style.cursor = historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer';
        }
    }

    // HTML Export functionality
    const exportHtmlBtn = document.getElementById('exportHtmlBtn');
    const htmlModalOverlay = document.getElementById('htmlModalOverlay');
    const closeHtmlModal = document.getElementById('closeHtmlModal');
    const htmlCodeOutput = document.getElementById('htmlCodeOutput');
    const copyHtmlBtn = document.getElementById('copyHtmlBtn');
    const downloadHtmlBtn = document.getElementById('downloadHtmlBtn');

    function generateHTML() {
        const isTransparent = transparentBgCheckbox && transparentBgCheckbox.checked;
        const bgColor = isTransparent ? 'transparent' : (canvasBgColor ? canvasBgColor.value : '#FFFFFF');
        
        let html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIBE EDiT Design Export</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: ${isTransparent ? 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px' : '#f5f5f5'};
        }
        .canvas-wrapper {
            width: ${canvas.width}px;
            height: ${canvas.height}px;
            background: ${bgColor};
            position: relative;
            box-shadow: 0 4px 40px rgba(0, 0, 0, 0.5);
        }
    </style>
</head>
<body>
    <div class="canvas-wrapper">`;

        // 모든 객체를 HTML로 변환
        Array.from(objectsLayer.children).forEach(child => {
            const rect = child.getBoundingClientRect();
            const canvasRect = canvasWrapper.getBoundingClientRect();
            const x = rect.left - canvasRect.left;
            const y = rect.top - canvasRect.top;
            
            if (child.classList.contains('text-object')) {
                const style = window.getComputedStyle(child);
                html += `
        <div style="position: absolute; left: ${x}px; top: ${y}px; font-size: ${style.fontSize}; font-family: ${style.fontFamily}; color: ${style.color};">
            ${child.textContent}
        </div>`;
            } else if (child.classList.contains('image-object')) {
                const img = child.querySelector('img');
                if (img) {
                    html += `
        <img src="${img.src}" style="position: absolute; left: ${x}px; top: ${y}px; width: ${child.offsetWidth}px; height: ${child.offsetHeight}px; object-fit: contain;">`;
                }
            } else if (child.classList.contains('shape-object')) {
                const svg = child.querySelector('svg');
                if (svg) {
                    html += `
        <div style="position: absolute; left: ${x}px; top: ${y}px; width: ${child.offsetWidth}px; height: ${child.offsetHeight}px;">
            ${svg.outerHTML}
        </div>`;
                }
            }
        });

        html += `
    </div>
</body>
</html>`;

        return html;
    }

    if (exportHtmlBtn && htmlModalOverlay) {
        exportHtmlBtn.addEventListener('click', () => {
            const html = generateHTML();
            if (htmlCodeOutput) {
                htmlCodeOutput.value = html;
            }
            htmlModalOverlay.classList.add('show');
        });
    }

    if (closeHtmlModal) {
        closeHtmlModal.addEventListener('click', () => {
            if (htmlModalOverlay) {
                htmlModalOverlay.classList.remove('show');
            }
        });
    }

    if (htmlModalOverlay) {
        htmlModalOverlay.addEventListener('click', (e) => {
            if (e.target === htmlModalOverlay) {
                htmlModalOverlay.classList.remove('show');
            }
        });
    }

    if (copyHtmlBtn) {
        copyHtmlBtn.addEventListener('click', () => {
            if (htmlCodeOutput) {
                htmlCodeOutput.select();
                document.execCommand('copy');
                copyHtmlBtn.textContent = '✓ 복사됨';
                setTimeout(() => {
                    copyHtmlBtn.textContent = '📋 복사';
                }, 2000);
            }
        });
    }

    if (downloadHtmlBtn) {
        downloadHtmlBtn.addEventListener('click', () => {
            const html = generateHTML();
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'design.html';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // HTML 소스코드를 이미지로 변환하는 기능
    const convertHtmlToImageBtn = document.getElementById('convertHtmlToImageBtn');
    if (convertHtmlToImageBtn && htmlCodeOutput) {
        convertHtmlToImageBtn.addEventListener('click', async () => {
            const htmlCode = htmlCodeOutput.value;
            if (!htmlCode) {
                alert('HTML 코드가 없습니다.');
                return;
            }

            if (typeof html2canvas === 'undefined') {
                alert('이미지 변환 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            try {
                // HTML 코드를 임시 iframe에 로드
                const iframe = document.createElement('iframe');
                iframe.style.position = 'absolute';
                iframe.style.left = '-9999px';
                iframe.style.width = '794px';
                iframe.style.height = '1123px';
                document.body.appendChild(iframe);

                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(htmlCode);
                iframeDoc.close();

                // iframe이 로드될 때까지 대기
                await new Promise((resolve) => {
                    iframe.onload = resolve;
                    setTimeout(resolve, 1000); // 최대 1초 대기
                });

                // iframe 내부의 body 요소를 찾아서 이미지로 변환
                const bodyElement = iframeDoc.body;
                if (!bodyElement) {
                    throw new Error('HTML을 로드할 수 없습니다.');
                }

                const canvasElement = await html2canvas(bodyElement, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    width: 794,
                    height: 1123
                });

                // 이미지 다운로드
                canvasElement.toBlob((blob) => {
                    if (!blob) {
                        alert('이미지 변환 중 오류가 발생했습니다.');
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'design-from-html.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    // iframe 제거
                    document.body.removeChild(iframe);
                }, 'image/png');
            } catch (error) {
                console.error('HTML to image conversion error:', error);
                alert('이미지 변환 중 오류가 발생했습니다: ' + error.message);
            }
        });
    }

    // Download functionality
    const downloadBtn = document.getElementById('downloadBtn');
    const exportFormat = document.getElementById('exportFormat');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const format = exportFormat ? exportFormat.value : 'png';
            const isTransparent = transparentBgCheckbox && transparentBgCheckbox.checked;
            
            if (!canvasWrapper) return;
            
            // html2canvas가 로드될 때까지 대기
            if (typeof html2canvas === 'undefined') {
                alert('이미지 변환 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }
            
            try {
                // canvasWrapper를 이미지로 변환
                const canvasElement = await html2canvas(canvasWrapper, {
                    backgroundColor: isTransparent ? null : (canvasBgColor ? canvasBgColor.value : '#FFFFFF'),
                    scale: 2, // 고해상도
                    useCORS: true,
                    logging: false,
                    allowTaint: true
                });
                
                canvasElement.toBlob((blob) => {
                    if (!blob) {
                        alert('다운로드 중 오류가 발생했습니다.');
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `design.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, format === 'png' && isTransparent ? 'image/png' : `image/${format}`);
            } catch (error) {
                console.error('다운로드 오류:', error);
                alert('다운로드 중 오류가 발생했습니다: ' + error.message);
            }
        });
    }

    // Save functionality
    const saveBtn = document.getElementById('saveBtn');
    const projectNameInput = document.getElementById('projectName');
    
    // Get project ID from URL or generate new one
    const urlParams = new URLSearchParams(window.location.search);
    let projectId = urlParams.get('id') || `vibe_project_${Date.now()}`;

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            // 현재 로그인한 사용자 확인
            const currentUser = JSON.parse(localStorage.getItem('vibe_user') || 'null');
            if (!currentUser || !currentUser.id) {
                alert('로그인이 필요합니다.');
                window.location.href = '/login.html';
                return;
            }
            
            // 프로젝트 데이터 준비
            const projectData = {
                canvas: {
                    width: canvas.width,
                    height: canvas.height,
                    background: transparentBgCheckbox && transparentBgCheckbox.checked ? 'transparent' : (canvasBgColor ? canvasBgColor.value : '#FFFFFF')
                },
                objects: Array.from(objectsLayer.children).map(child => {
                    const rect = child.getBoundingClientRect();
                    const canvasRect = canvasWrapper.getBoundingClientRect();
                    const x = rect.left - canvasRect.left;
                    const y = rect.top - canvasRect.top;
                    
                    const obj = {
                        type: child.classList.contains('text-object') ? 'text' : 
                              child.classList.contains('image-object') ? 'image' : 'shape',
                        x: x,
                        y: y,
                        width: child.offsetWidth,
                        height: child.offsetHeight
                    };
                    
                    if (child.classList.contains('text-object')) {
                        const style = window.getComputedStyle(child);
                        obj.text = child.textContent;
                        obj.fontSize = style.fontSize;
                        obj.fontFamily = style.fontFamily;
                        obj.color = style.color;
                        obj.textType = child.dataset.textType || '본문 텍스트';
                    } else if (child.classList.contains('image-object')) {
                        const img = child.querySelector('img');
                        if (img) {
                            obj.src = img.src;
                        }
                    } else if (child.classList.contains('shape-object')) {
                        const svg = child.querySelector('svg');
                        if (svg) {
                            const path = svg.querySelector('path, rect, circle, polygon');
                            if (path) {
                                obj.fill = path.getAttribute('fill') || path.style.fill;
                            }
                        }
                        obj.shapeType = child.dataset.shapeType;
                    }
                    
                    return obj;
                })
            };
            
            const projectName = projectNameInput ? projectNameInput.value : '제목 없는 디자인';
            
            try {
                // 프로젝트가 이미 존재하는지 확인 (URL에 id가 있으면 업데이트)
                if (urlParams.get('id')) {
                    // 업데이트
                    const response = await fetch(`/api/projects/${projectId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: projectName,
                            data: projectData,
                            thumbnail: null // 썸네일은 나중에 추가 가능
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        saveBtn.textContent = '✓ 저장됨';
                        setTimeout(() => {
                            saveBtn.textContent = '💾 저장';
                        }, 2000);
                    } else {
                        throw new Error(result.message || '저장 실패');
                    }
                } else {
                    // 새로 생성
                    const response = await fetch('/api/projects', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: currentUser.id,
                            name: projectName,
                            data: projectData,
                            thumbnail: null
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        // URL에 프로젝트 ID 추가
                        projectId = result.project.id;
                        window.history.replaceState({}, '', `editor.html?id=${projectId}`);
                        
                        saveBtn.textContent = '✓ 저장됨';
                        setTimeout(() => {
                            saveBtn.textContent = '💾 저장';
                        }, 2000);
                    } else {
                        throw new Error(result.message || '저장 실패');
                    }
                }
            } catch (error) {
                console.error('Save error:', error);
                alert('저장 중 오류가 발생했습니다: ' + error.message);
                saveBtn.textContent = '💾 저장';
            }
        });
    }
    
    // Load project if ID is in URL
    if (urlParams.get('id')) {
        // D1 데이터베이스에서 프로젝트 로드
        (async () => {
            try {
                const response = await fetch(`/api/projects/${projectId}`);
                const result = await response.json();
                
                if (!result.success || !result.project) {
                    console.error('프로젝트를 찾을 수 없습니다.');
                    return;
                }
                
                const projectData = result.project;
                const projectObjects = typeof projectData.data === 'string' ? JSON.parse(projectData.data) : projectData.data;
                
                // Load project name
                if (projectNameInput && projectData.name) {
                    projectNameInput.value = projectData.name;
                }
                
                // Load canvas settings
                if (projectObjects.canvas) {
                    canvas.width = projectObjects.canvas.width;
                    canvas.height = projectObjects.canvas.height;
                    
                    // Update canvas wrapper size
                    if (canvasWrapper) {
                        canvasWrapper.style.width = `${projectObjects.canvas.width}px`;
                        canvasWrapper.style.height = `${projectObjects.canvas.height}px`;
                    }
                    
                    // Set background
                    if (projectObjects.canvas.background === 'transparent') {
                        if (transparentBgCheckbox) transparentBgCheckbox.checked = true;
                        if (canvasWrapper) canvasWrapper.style.background = 'transparent';
                    } else {
                        if (transparentBgCheckbox) transparentBgCheckbox.checked = false;
                        if (canvasBgColor) canvasBgColor.value = projectObjects.canvas.background;
                        if (canvasBgColorText) canvasBgColorText.value = projectObjects.canvas.background.toUpperCase();
                        if (canvasWrapper) canvasWrapper.style.background = projectObjects.canvas.background;
                        ctx.fillStyle = projectObjects.canvas.background;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                }
                
                // Load objects
                if (projectObjects.objects && objectsLayer) {
                    projectObjects.objects.forEach(obj => {
                        if (obj.type === 'text') {
                            const textDiv = document.createElement('div');
                            textDiv.className = 'canvas-object text-object';
                            textDiv.style.position = 'absolute';
                            textDiv.style.left = `${obj.x}px`;
                            textDiv.style.top = `${obj.y}px`;
                            textDiv.style.fontSize = obj.fontSize || '18px';
                            textDiv.style.fontFamily = obj.fontFamily || 'Arial';
                            textDiv.style.color = obj.color || '#000000';
                            textDiv.style.cursor = 'default';
                            textDiv.style.minWidth = '100px';
                            textDiv.style.minHeight = '20px';
                            textDiv.style.padding = '4px';
                            textDiv.contentEditable = 'false';
                            textDiv.textContent = obj.text || '텍스트';
                            if (obj.textType) {
                                textDiv.dataset.textType = obj.textType;
                            }
                            objectsLayer.appendChild(textDiv);
                            makeDraggable(textDiv);
                        } else if (obj.type === 'image') {
                            const imageDiv = document.createElement('div');
                            imageDiv.className = 'canvas-object image-object';
                            imageDiv.style.position = 'absolute';
                            imageDiv.style.left = `${obj.x}px`;
                            imageDiv.style.top = `${obj.y}px`;
                            imageDiv.style.width = `${obj.width}px`;
                            imageDiv.style.height = `${obj.height}px`;
                            imageDiv.style.cursor = 'move';
                            imageDiv.dataset.keepRatio = 'true';
                            imageDiv.dataset.originalWidth = obj.width;
                            imageDiv.dataset.originalHeight = obj.height;
                            
                            const imgElement = document.createElement('img');
                            imgElement.src = obj.src;
                            imgElement.style.width = '100%';
                            imgElement.style.height = '100%';
                            imgElement.style.objectFit = 'contain';
                            imgElement.draggable = false;
                            imageDiv.appendChild(imgElement);
                            objectsLayer.appendChild(imageDiv);
                            makeDraggable(imageDiv);
                        } else if (obj.type === 'shape') {
                            const shapeDiv = document.createElement('div');
                            shapeDiv.className = 'canvas-object shape-object';
                            shapeDiv.style.position = 'absolute';
                            shapeDiv.style.left = `${obj.x}px`;
                            shapeDiv.style.top = `${obj.y}px`;
                            shapeDiv.style.width = `${obj.width}px`;
                            shapeDiv.style.height = `${obj.height}px`;
                            shapeDiv.style.cursor = 'move';
                            shapeDiv.dataset.keepRatio = 'true';
                            shapeDiv.dataset.originalWidth = obj.width;
                            shapeDiv.dataset.originalHeight = obj.height;
                            shapeDiv.dataset.shapeType = obj.shapeType;
                            
                            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                            svg.setAttribute('width', '100%');
                            svg.setAttribute('height', '100%');
                            svg.setAttribute('viewBox', '0 0 100 100');
                            svg.style.display = 'block';
                            
                            // Shape creation based on shapeType
                            let shapeElement;
                            const fillColor = obj.fill || '#8B5CF6';
                            
                            switch(obj.shapeType) {
                                case 'rect':
                                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                                    shapeElement.setAttribute('x', '10');
                                    shapeElement.setAttribute('y', '10');
                                    shapeElement.setAttribute('width', '80');
                                    shapeElement.setAttribute('height', '80');
                                    shapeElement.setAttribute('fill', fillColor);
                                    break;
                                case 'circle':
                                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                                    shapeElement.setAttribute('cx', '50');
                                    shapeElement.setAttribute('cy', '50');
                                    shapeElement.setAttribute('r', '40');
                                    shapeElement.setAttribute('fill', fillColor);
                                    break;
                                case 'triangle':
                                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                                    shapeElement.setAttribute('points', '50,10 90,90 10,90');
                                    shapeElement.setAttribute('fill', fillColor);
                                    break;
                                case 'star':
                                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                                    shapeElement.setAttribute('points', '50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35');
                                    shapeElement.setAttribute('fill', fillColor);
                                    break;
                                case 'diamond':
                                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                                    shapeElement.setAttribute('points', '50,10 90,50 50,90 10,50');
                                    shapeElement.setAttribute('fill', fillColor);
                                    break;
                                case 'heart':
                                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    shapeElement.setAttribute('d', 'M50,85 C50,85 10,50 10,30 C10,20 18,12 28,12 C35,12 40,16 43,20 C46,16 51,12 58,12 C68,12 76,20 76,30 C76,50 40,85 40,85 C40,85 50,85 50,85 Z');
                                    shapeElement.setAttribute('fill', fillColor);
                                    shapeElement.setAttribute('transform', 'scale(0.8) translate(6, 6)');
                                    break;
                                default:
                                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                                    shapeElement.setAttribute('x', '10');
                                    shapeElement.setAttribute('y', '10');
                                    shapeElement.setAttribute('width', '80');
                                    shapeElement.setAttribute('height', '80');
                                    shapeElement.setAttribute('fill', fillColor);
                            }
                            
                            svg.appendChild(shapeElement);
                            shapeDiv.appendChild(svg);
                            objectsLayer.appendChild(shapeDiv);
                            makeDraggable(shapeDiv);
                        }
                    });
                    updateLayers();
                }
            } catch (e) {
                console.error('Error loading project:', e);
            }
        })();
    }

    // Undo/Redo button handlers
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (historyIndex > 0) {
                historyIndex--;
                const state = history[historyIndex];
                if (state) {
                    restoreState(state);
                }
                updateUndoRedoButtons();
            }
        });
    }

    if (redoBtn) {
        redoBtn.addEventListener('click', () => {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                const state = history[historyIndex];
                if (state) {
                    restoreState(state);
                }
                updateUndoRedoButtons();
            }
        });
    }

    // 초기 히스토리 저장
    setTimeout(() => {
        saveState();
    }, 1000);

    // Add event listeners for user interactions
    canvas.addEventListener('click', onCanvasClick);
});