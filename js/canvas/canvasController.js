// This file controls the canvas operations, including zooming, background changes, and managing the state of the canvas.

class CanvasController {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.context = this.canvas.getContext('2d');
        this.zoomLevel = 1;
        this.backgroundColor = '#FFFFFF';
        this.objects = [];
    }

    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.render();
    }

    zoomIn() {
        this.zoomLevel += 0.1;
        this.render();
    }

    zoomOut() {
        this.zoomLevel = Math.max(0.1, this.zoomLevel - 0.1);
        this.render();
    }

    addObject(object) {
        this.objects.push(object);
        this.render();
    }

    render() {
        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set background color
        this.context.fillStyle = this.backgroundColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom
        this.context.save();
        this.context.scale(this.zoomLevel, this.zoomLevel);
        
        // Render each object
        this.objects.forEach(obj => {
            if (obj.type === 'text') {
                this.context.fillStyle = obj.color;
                this.context.font = `${obj.fontSize}px Arial`;
                this.context.fillText(obj.value, obj.x, obj.y);
            } else if (obj.type === 'image') {
                const img = new Image();
                img.src = obj.src;
                img.onload = () => {
                    this.context.drawImage(img, obj.x, obj.y, obj.width, obj.height);
                };
            }
            // Additional object types can be handled here
        });

        this.context.restore();
    }
}

// Export the CanvasController class for use in other modules
export default CanvasController;