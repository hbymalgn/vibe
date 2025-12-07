// This file is responsible for rendering objects (text, images, shapes) on the canvas and managing their properties.

class ObjectRenderer {
    constructor(canvas) {
        this.canvas = canvas;
    }

    renderText(textObject) {
        const text = new fabric.Text(textObject.value, {
            left: textObject.x,
            top: textObject.y,
            fontSize: textObject.fontSize,
            fill: textObject.color,
            selectable: true,
        });
        this.canvas.add(text);
    }

    renderImage(imageObject) {
        fabric.Image.fromURL(imageObject.src, (img) => {
            img.set({
                left: imageObject.x,
                top: imageObject.y,
                width: imageObject.width,
                height: imageObject.height,
                selectable: true,
            });
            this.canvas.add(img);
        });
    }

    renderShape(shapeObject) {
        let shape;
        switch (shapeObject.type) {
            case 'rectangle':
                shape = new fabric.Rect({
                    left: shapeObject.x,
                    top: shapeObject.y,
                    fill: shapeObject.color,
                    width: shapeObject.width,
                    height: shapeObject.height,
                    selectable: true,
                });
                break;
            case 'circle':
                shape = new fabric.Circle({
                    left: shapeObject.x,
                    top: shapeObject.y,
                    fill: shapeObject.color,
                    radius: shapeObject.radius,
                    selectable: true,
                });
                break;
            // Add more shapes as needed
        }
        if (shape) {
            this.canvas.add(shape);
        }
    }

    renderObjects(objects) {
        objects.forEach((object) => {
            switch (object.type) {
                case 'text':
                    this.renderText(object);
                    break;
                case 'image':
                    this.renderImage(object);
                    break;
                case 'shape':
                    this.renderShape(object);
                    break;
                default:
                    console.warn('Unknown object type:', object.type);
            }
        });
    }
}

// Export the ObjectRenderer class for use in other modules
export default ObjectRenderer;