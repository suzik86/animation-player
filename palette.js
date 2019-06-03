let current_color;
let prev_color;
let $current_color;
let $prev_color;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Action {
    constructor(color) {
        this.color = color;
    }

    draw(ctx) {

    }
}

class ActionLine extends Action {
    constructor(coordFrom, coordTo, color) {
        super(color);
        this.coordFrom = coordFrom;
        this.coordTo = coordTo;
        
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.moveTo(this.coordFrom.x, this.coordFrom.y);
        ctx.lineTo(this.coordTo.x, this.coordTo.y);
        ctx.stroke();

    }
}

class Frame {    
    constructor() {
        this.actions = [];
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 600);
        this.actions.forEach((item) => item.draw(ctx));
    }
    
    clear() {
        this.actions = [];
    }

    addAction(action) {
        this.actions.push(action);
    }
}

class SceneModel {
    constructor() {
        this.frames = [];
        this.color = 'red';
        this.activeFrame = null;
    }

    addFrame() {
        const frame = new Frame();
        this.frames.push(frame);

        return frame;
    }

    deleteFrame(num) {
        this.frames.splice(num, 1);
        return this.frames.length > 0 ? this.frames[0] : null;
    }

    duplicateFrame(num) {
        const newFrame = new Frame();
        newFrame.actions = this.frames[num].actions.slice(0);
        this.frames.push(newFrame);
        this.activeFrame = this.frames.length - 1;
        return newFrame;
    }

    setCurrentColor(color) {
        this.color = color;
    }

    next() {
        this.activeFrame++;
        this.activeFrame = this.activeFrame % this.frames.length;
        return this.frames[this.activeFrame];
    }

}

class SceneView {
    constructor($framesElement, $canvasElement, model) {
        this.$framesElement = $framesElement;
        this.$canvasElement = $canvasElement;
        this.model = model;
    }

    drawFrames() {
        this.$framesElement.html(this.model.frames.map((item, i) => { 
            let klass = i == this.model.activeFrame ? 'active' : '';
            return `<li class="${klass}" data-id="${i}">${i}<a class="delete btn btn-red btn-sm" title="delete"><i class="fa fa-trash"></i></a><a class="duplicate btn btn-default btn-sm" title="Duplicate"><i class="fa fa-plus"></i></a></li>`
        }).join('')) 
    }

    redraw() {
        this.drawFrames();
    }
}

class SceneController {
    constructor(view, model, ctx, previewCtx) {
        this.model = model;
        this.activeFrame = null;
        this.view = view;
        this.ctx = ctx;
        this.previewCtx = previewCtx;
        this.timer = null;
    }

    nextFrame() {
        this.activeFrame = this.model.next();
        this.redraw();
    }

    play(speed) {
        let self = this;
        this.timer = setInterval(function() {
            self.nextFrame();
        }, 1000 / speed);
    }

    stop() {
        clearTimeout(this.timer);
    }

    redraw() {
        this.view.redraw();
        this.draw();
    }

    addFrame() {
        this.activeFrame = this.model.addFrame();
        this.setActiveFrame(this.model.frames.length - 1)
        this.redraw();
    }

    duplicateFrame(num)  {
        this.activeFrame = this.model.duplicateFrame(num);
        this.setActiveFrame(this.model.frames.length - 1)
        this.redraw();
    }

    deleteFrame(num)  {
        this.activeFrame = this.model.deleteFrame(num);
        this.setActiveFrame(this.model.frames.length - 1)
        this.redraw();
    }


    setActiveFrame(num) {
        this.activeFrame = this.model.frames[num];
        this.model.activeFrame = num;
        this.draw();
    }

    draw() {
        if (this.activeFrame) {
            this.activeFrame.draw(this.ctx);
            this.activeFrame.draw(this.previewCtx);
        }
    }

    addLineAction(coordFrom, coordTo) {
        const lineAction = new ActionLine(coordFrom, coordTo, this.model.color);
        this.activeFrame.addAction(lineAction);
        this.draw();
    }

    setCurrentColor(color) {
        this.model.setCurrentColor(color);
    };
}





$(function() {
    const ctx = document.getElementById('canvas').getContext('2d');
    const previewCtx = document.getElementById('preview').getContext('2d');
    const scneneModel = new SceneModel();
    const sceneView = new SceneView($('#frames'), $('#canvas'), scneneModel);
    const scene = new SceneController(sceneView, scneneModel, ctx, previewCtx);
    scene.addFrame();

    var $palette_buttons = $('#pallete button');
    $current_color = $('#current-color');
    $prev_color = $('#prev-color');
    set_current_color('green');


    const $canvas = $('#canvas');

    let mouseDown = false;
    $canvas.mousedown(function() {
        mouseDown = true;
    });

    $canvas.mouseup(function(){
        mouseDown = false;
    })

    let prevX, prevY;

    $canvas.mousemove(function(event) {
        if (mouseDown) {
            scene.addLineAction(new Point(prevX, prevY), new Point(event.offsetX, event.offsetY));
        }

        prevX = event.offsetX;
        prevY = event.offsetY;
    });


    let play = false;
    $('#play').click(function(){
        if (play) {
            scene.stop();
            $(this).text('Play');
        } else {
            scene.play($('#speed').val());
            $(this).text('Stop');
        }

        play = !play;
    });

    $('#speed').change(function(){
        scene.stop();
        scene.play($('#speed').val());
    });


    $palette_buttons.click(function(){
        
        $palette_buttons.removeClass('active');
        $(this).addClass('active');

        color = $(this).data('color');

        set_current_color(color)
    })

    var $tool_buttons = $('#tools button');
    var current_tool = 'move';
    $tool_buttons.click(function(){
        
        $tool_buttons.removeClass('active');
        $(this).addClass('active');

        current_tool = $(this).data('tool');
    });

    $('#add-frame').click(function(){
        scene.addFrame();
    });

    $('#frames').on('click', 'li', function() {
        $('#frames li').removeClass('active');
        $(this).addClass('active');
        scene.setActiveFrame($(this).data('id'));
    });

    $('#frames').on('click', 'li a.duplicate', function(e) {
        scene.duplicateFrame($(this).parent().data('id'));
        e.stopPropagation();
    });

    $('#frames').on('click', 'li a.delete', function(e) {
        scene.deleteFrame($(this).parent().data('id'));
        e.stopPropagation();
    });


    function action_picker(figure) {
        set_current_color($(figure).css("background-color"));
    }

    function set_current_color(color) {
        prev_color = current_color;
        current_color = color;
        scene.setCurrentColor(color);
    
        $current_color.data('color', color);
        $current_color.find('.badge').css('background-color', color)
    
        $prev_color.data('color', prev_color);
        $prev_color.find('.badge').css('background-color', prev_color)
    }

    $('#fullscreen').click(function(){
        $('#canvas')[0].requestFullscreen();
    });

    $(document).click(function(){
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } 
    })

});
