Molecule.module('Molecule.Game', function (require, p) {

    var MapFile = require('Molecule.MapFile'),
        Camera = require('Molecule.Camera'),
        Scene = require('Molecule.Scene'),
        Map = require('Molecule.Map'),
        ImageFile = require('Molecule.ImageFile'),
        AudioFile = require('Molecule.AudioFile'),
        Input = require('Molecule.Input'),
        Text = require('Molecule.Text'),
        physics = require('Molecule.Physics'),
        move = require('Molecule.Move'),
        calculateSpriteCollisions = require('Molecule.SpriteCollisions'),
        calculateMapCollisions = require('Molecule.MapCollisions'),
        Sprite = require('Molecule.Sprite'),
        MObject = require('Molecule.MObject'),
        utils = require('Molecule.utils');

    p.init = null;

    // Objects defined inline
    // game.object.define('Something', {});
    p.inlineObjects = {

    };

    p.updateGame = function () {
    };

    p.update = function (_exit, game) {
        var sprite;

        for (var i = 0; i < game.scene.sprites.length; i++) {
            sprite = game.scene.sprites[i];
            sprite.update();
            sprite.flipUpdate();
            if (sprite.animation !== null && _exit)
                sprite.animation.nextFrame();
        }

        if (game.map) {
            game.map.update();
        }


    };

    p.loadResources = function (_interval, game) {
        var total = game.imageFile.data.length + game.mapFile.maps.length + game.audioFile.data.length;
        var total_loaded = game.imageFile.counter + game.mapFile.getCounter() + game.audioFile.counter;
        if (game.imageFile.isLoaded() && game.mapFile.isLoaded() && game.audioFile.isLoaded()) {
            clearInterval(_interval);
            for (var i = 0; i < game.scene.sprites.length; i++) {
                game.scene.sprites[i].getAnimation();
            }
            p.init();
            p.loop(game);
        }
        game.context.save();
        game.context.fillStyle = '#f8f8f8';
        game.context.fillRect(30, Math.round(game.height / 1.25), (game.width - (30 * 2)), 16);
        game.context.fillStyle = '#ea863a';
        game.context.fillRect(30, Math.round(game.height / 1.25), (game.width - (30 * 2)) * (total_loaded / total), 16);
        game.context.restore();
    };

    p.removeSprites = function (sprites) {
        for (var i = sprites.length - 1; i >= 0; i--) {
            if (sprites[i].kill) {
                sprites.splice(i, 1);
            }
        }
    };

    p.resetCollisionState = function (sprites) {
        var sprite;
        for (var i = 0; i < sprites.length; i++) {
            sprite = sprites[i];
            sprite.collision.sprite.id = null;
            sprite.collision.sprite.left = false;
            sprite.collision.sprite.right = false;
            sprite.collision.sprite.up = false;
            sprite.collision.sprite.down = false;

            sprite.collision.map.tile = null;
            sprite.collision.map.left = false;
            sprite.collision.map.right = false;
            sprite.collision.map.up = false;
            sprite.collision.map.down = false;

            sprite.collision.boundaries.id = null;
            sprite.collision.boundaries.left = false;
            sprite.collision.boundaries.right = false;
            sprite.collision.boundaries.up = false;
            sprite.collision.boundaries.down = false;
        }
    };

    p.updateObjects = function (game) {
        var object;
        for (var i = 0; i < game.scene.objects.length; i++) {
            object = game.scene.objects[i];
            if (object.update) object.update();
        }
    }

    p.loop = function (game) {

        p.requestAnimFrame(function () {
            p.loop(game);
        });
        p.removeSprites(game.scene.sprites);
        p.update(null, game);
        if (game.status == 1) {
            var exit = false;
            physics(game);
            p.resetCollisionState(game.scene.sprites);
            while (!exit) {
                exit = move(game.scene.sprites);
                calculateMapCollisions(game);
                calculateSpriteCollisions(game);
                p.updateSpriteCollisionCheck(game.scene.sprites);
                if (game.camera.type === 1) {
                    game.camera.update(game.scene.sprites);
                }
                p.update(exit, game);
                p.checkBoundaries(game);
                game.resetMove();
            }
        }
        p.draw(game);
        p.updateObjects(game);
        p.updateGame();
    };

    p.updateSpriteCollisionCheck = function (sprites) {
        var sprite;
        for (var i = 0; i < sprites.length; i++) {
            sprite = sprites[i];
            if (sprite.speed.check.x && sprite.speed.check.y) {
                sprite.resetMove();
            }
        }
    };

    p.checkBoundaries = function (game) {
        var sprite;
        for (var i = 0; i < game.scene.sprites.length; i++) {
            sprite = game.scene.sprites[i];
            if (game.boundaries.x !== null && sprite.collides.boundaries) {
                if (sprite.position.x - sprite.anchor.x + sprite.frame.offset.x < game.boundaries.x) {
                    sprite.position.x = game.boundaries.x + sprite.anchor.x - sprite.frame.offset.x;
                    sprite.collision.boundaries.left = true;
                    sprite.collision.boundaries.id = 0;
                    sprite.move.x = 0;
                    sprite.speed.x = 0;
                    sprite.speed.t.x = 0;
                    if (game.physics.gravity.x < 0) {
                        sprite.speed.gravity.x = 0;
                    }
                }
                if (sprite.position.x + sprite.frame.width - sprite.anchor.x - sprite.frame.offset.x > game.boundaries.x + game.boundaries.width) {
                    sprite.position.x = game.boundaries.x + game.boundaries.width - sprite.frame.width + sprite.anchor.x + sprite.frame.offset.x;
                    sprite.collision.boundaries.right = true;
                    sprite.collision.boundaries.id = 1;
                    sprite.move.x = 0;
                    sprite.speed.x = 0;
                    sprite.speed.t.x = 0;
                    if (game.physics.gravity.x > 0) {
                        sprite.speed.gravity.x = 0;
                    }
                }
            }
            if (game.boundaries.y !== null && sprite.collides.boundaries) {
                if (sprite.position.y - sprite.anchor.y + sprite.frame.offset.y < game.boundaries.y) {
                    sprite.position.y = game.boundaries.y + sprite.anchor.y - sprite.frame.offset.y;
                    sprite.collision.boundaries.up = true;
                    sprite.collision.boundaries.id = 2;
                    sprite.move.y = 0;
                    sprite.speed.y = 0;
                    sprite.speed.t.y = 0;
                    if (game.physics.gravity.y < 0) {
                        sprite.speed.gravity.y = 0;
                    }
                }
                if (sprite.position.y + sprite.frame.height - sprite.anchor.y - sprite.frame.offset.y > game.boundaries.y + game.boundaries.height) {
                    sprite.position.y = game.boundaries.y + game.boundaries.height - sprite.frame.height + sprite.anchor.y + sprite.frame.offset.y;
                    sprite.collision.boundaries.down = true;
                    sprite.collision.boundaries.id = 3;
                    sprite.move.y = 0;
                    sprite.speed.y = 0;
                    sprite.speed.t.y = 0;
                    if (game.physics.gravity.y > 0) {
                        sprite.speed.gravity.y = 0;
                    }
                }
            }
        }
    };

    p.draw = function (game) {
        game.context.clearRect(0, 0, game.canvas.width, game.canvas.height);
        if (game.map && game.map.visible) {
            game.map.draw(false);
        }
        for (var i = 0; i < game.scene.sprites.length; i++) {
            if (game.scene.sprites[i].visible) {
                game.scene.sprites[i].draw(false);
            }
        }
        for (var i = 0; i < game.scene.sprites.length; i++) {
            if (game.scene.sprites[i].visible) {
                game.scene.sprites[i].draw(true);
            }
        }
        if (game.map && game.map.visible) {
            game.map.draw(true);
        }
        for (var i = 0; i < game.scene.text.length; i++) {
            if (game.scene.text[i].visible) {
                game.scene.text[i].draw();
            }
        }
    };

    p.requestAnimFrame = (function () {
        var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
            window.setTimeout(callback, 1000 / 60)
        };
        return requestAnimFrame.bind(window);
    })();

    p.start = function (game) {
        var interval = setInterval(function () {
            p.loadResources(interval, game);
        }, 100);
    };

    p.propertiesMatch = function (obj, props) {

        var matches = true;

        if (!props) {
            return true;
        }


        for (var prop in props) {
            if (props.hasOwnProperty(prop) && obj[prop] !== props[prop]) {
                matches = false;
            }
        }

        return matches;
    };

    p.timeouts = [];

    var Game = function (options) {

        // PROPERTIES
        this.canvas = null;
        this.context = null;
        this.next = {scene: null, fade: null};
        this.status = 1;
        this.timer = {loop: 60 / 1000, previus: null, now: null, fps: 60, frame: 0};
        this.sounds = {};
        this.sprites = {};
        this.tilemaps = {};
        this.globals = options.globals || {};
        this.node = options.node;

        // OPTIONS
        this.scale = options.scale || 1;
        this.width = options.width;
        this.height = options.height;

        // CANVAS
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', 'canvas');
        this.canvas.width = options.width;
        this.canvas.height = options.height;
        this.canvas.style.width = options.width * this.scale + "px";
        this.canvas.style.height = options.height * this.scale + "px";
        this.context = this.canvas.getContext('2d');

        // GAME COMPONENTS
        this.camera = new Camera(this);
        this.scene = new Scene(this);
        this.map = new Map(this);
        this.input = new Input(this);

        // ASSET LOADING
        this.imageFile = new ImageFile(this);
        this.audioFile = new AudioFile(this);
        this.mapFile = new MapFile(this);

        // GAME SETTINGS
        this.physics = {gravity: {x: 0, y: 0}, friction: {x: 0, y: 0}};
        this.boundaries = {x: null, y: null, width: null, height: null};


        // BINDERS
        utils.bindMethods(this.object, this);
        utils.bindMethods(this.sprite, this);
        utils.bindMethods(this.text, this);
        utils.bindMethods(this.tilemap, this);

        this.node ? document.getElementById(this.node).appendChild(this.canvas) : document.body.appendChild(this.canvas);

    };

    Game.prototype.audio = function (_id) {

        return this.sounds[_id];

    };

    // TODO: Should not be able to add objects more than once
    Game.prototype.add = function (obj) {

        if (arguments.length === 0 || arguments.length > 1 || typeof arguments[0] === 'string') {
            throw new Error('You can only add a single sprite, Molecule Object or text, use respective game.sprite.add, game.object.add and game.text.add');
        }

        if (obj instanceof MObject) {
            return this.object.add(obj);
        }

        if (obj instanceof Sprite) {
            return this.sprite.add(obj)
        }

        if (obj instanceof Text) {
            return this.text.add(obj);
        }

        if (typeof obj === 'function') { // Constructor
            return this.object.add(obj);
        }

        throw new Error('You did not pass sprite, Molecule Object or text');

    };

    Game.prototype.get = function () {

        return {
            sprites: this.scene.sprites,
            objects: this.scene.objects,
            text: this.scene.text
        }

    };

    Game.prototype.remove = function (obj) {

        if (arguments.length === 0 || arguments.length > 1) {
            throw new Error('You can only remove a single sprite, Molecule Object or text');
        }

        if (obj instanceof MObject) {
            return this.object.remove(obj);
        }

        if (obj instanceof Sprite) {
            return this.sprite.remove(obj)
        }

        if (obj instanceof Text) {
            return this.text.remove(obj);
        }

        throw new Error('You did not pass sprite, Molecule Object or text');

    };

    Game.prototype.is = function (obj, type) {
        return obj._MoleculeType === type;
    };

    // Not in use, remove?
    Game.prototype.updateTimer = function () {
        this.timer.frame++;
        this.timer.now = new Date().getTime();
        if (this.timer.previus !== null)
            this.timer.loop = (this.timer.now - this.timer.previus) / 1000;
        if (this.timer.now - this.timer.previus >= 1000) {
            this.timer.previus = this.timer.now;
            this.timer.fps = this.timer.frame;
            this.timer.frame = 0;
        }
    };

    Game.prototype.play = function () {
        this.status = 1;
    };

    Game.prototype.stop = function () {
        this.status = 0;
    };

    Game.prototype.resetMove = function () {

        for (var i = 0; i < this.scene.sprites.length; i++) {
            this.scene.sprites[i].resetMove();
        }
        if (this.map) {
            this.map.resetScroll();
        }

        p.update(null, this);

    };

    Game.prototype.cameraUpdate = function (_exit) {
        for (var i = 0; i < this.scene.sprites.length; i++) {
            this.scene.sprites[i].update();
            this.scene.sprites[i].flipUpdate();
            if (this.scene.sprites[i].animation !== null && _exit)
                this.scene.sprites[i].animation.nextFrame();
        }
        if (this.map !== null)
            this.map.update();
    };

    Game.prototype.start = function () {
        p.start(this);
    };

    Game.prototype.init = function (initializeModules, callback) {
        var self = this;
        p.init = function () {
            initializeModules();
            callback.call(self.globals, self, require);
        }
    };

    Game.prototype.update = function (callback) {
        p.updateGame = callback.bind(this.globals, this, require);
    };

    // All methods are bound to game object
    Game.prototype.object = {
        define: function () {
            var name = arguments.length > 1 ? arguments[0] : null,
                options = arguments.length === 1 ? arguments[0] : arguments[1],
                Obj = MObject.extend.call(MObject, options);


            // No name means it is coming from a module
            if (!name) {
                return Obj;
            }

            if (!p.inlineObjects[name]) {
                p.inlineObjects[name] = Obj;
            } else {
                throw new Error(name + ' already exists as an object');
            }

            return Obj;

        },
        create: function () {
            var name = arguments[0],
                options = arguments[1],
                Obj,
                obj;

            // If passing a constructor
            if (typeof arguments[0] === 'function') {
                return new arguments[0](arguments[1]);
            }

            if (p.inlineObjects[name]) {
                Obj = p.inlineObjects[name];
            } else {
                Obj = require(name);
            }

            obj = new Obj(options);
            obj._MoleculeType = name;
            return obj;
        },
        add: function () {

            var obj;

            if (typeof arguments[0] === 'string') {
                obj = this.object.create(arguments[0], arguments[1]);
            } else if (utils.isMObject(arguments[0])) {
                obj = arguments[0];
            } else if (typeof arguments[0] === 'function') { // constructor
                obj = new arguments[0](arguments[1]);
            } else {
                throw new Error('Wrong parameters, need a string or Molecule Object');
            }

            this.scene.objects.push(obj);

            if (obj.text) {
                for (var text in obj.text) {
                    if (obj.text.hasOwnProperty(text)) {
                        this.scene.text.push(obj.text[text]);
                    }
                }
            }

            if (obj.sprite) {
                this.scene.sprites.push(obj.sprite);
            } else if (obj.sprites) {
                for (var sprite in obj.sprites) {
                    if (obj.sprites.hasOwnProperty(sprite)) {
                        this.scene.sprites.push(obj.sprites[sprite]);
                    }
                }
            }

            return obj;
        },
        get: function () {

            var options;

            if (!arguments.length) {
                return this.scene.objects;
            }

            if (typeof arguments[0] === 'string') {

                options = arguments[1] || {};
                options._MoleculeType = arguments[0]

                return utils.find(this.scene.objects, options);

            } else {
                return utils.find(this.scene.objects, arguments[0]);
            }

        },
        remove: function () {
            var objectsToRemove = arguments[0] instanceof MObject ? [arguments[0]] : this.object.get.apply(this, arguments),
                game = this;
            objectsToRemove.forEach(function (obj) {
                obj.removeListeners();
                game.scene.objects.splice(game.scene.objects.indexOf(obj), 1);
                if (obj.sprite) {
                    game.scene.sprites.splice(game.scene.sprites.indexOf(obj.sprite), 1);
                } else if (obj.sprites) {
                    for (var sprite in obj.sprites) {
                        if (obj.sprites.hasOwnProperty(sprite)) {
                            game.scene.sprites.splice(game.scene.sprites.indexOf(obj.sprites[sprite]), 1);
                        }
                    }
                }
            });
        }
    };

    // All methods are bound to game object
    Game.prototype.sprite = {

        create: function (_id) {
            var loadedSprite,
                sprite;

            if (this.sprites[_id]) {
                loadedSprite = this.sprites[_id];
                sprite = loadedSprite.clone();
            } else {
                throw new Error('Sprite ' + _id + ' does not exist. Has it been loaded?');
            }

            return sprite;
        },
        add: function () {

            var sprite;

            if (typeof arguments[0] === 'string') {
                sprite = this.sprite.create(arguments[0]);
            } else if (utils.isSprite(arguments[0])) {
                sprite = arguments[0];
            } else {
                throw new Error('Wrong parameters, need a string or sprite');
            }

            this.scene.sprites.push(sprite);

            return sprite;
        },
        get: function () {

            var options;

            if (!arguments.length) {
                return this.scene.sprites;
            }

            if (typeof arguments[0] === 'string') {

                options = {
                    name: arguments[0]
                };

                return utils.find(this.scene.sprites, options);

            } else {
                return utils.find(this.scene.sprites, arguments[0]);
            }

        },
        remove: function () {
            var spritesToRemove = arguments[0] instanceof Sprite ? [arguments[0]] : this.sprite.get.apply(this, arguments),
                game = this;
            spritesToRemove.forEach(function (sprite) {
                game.scene.sprites.splice(game.scene.sprites.indexOf(sprite), 1);
            });
        }
    };

    // All methods are bound to game object
    Game.prototype.text = {

        create: function (options) {
            var t = new Text(options, this);
            return t;
        },
        add: function () {

            var text;

            if (utils.isText(arguments[0])) {
                text = arguments[0];
            } else if (utils.isObject(arguments[0])) {
                text = this.text.create(arguments[0]);
            } else {
                throw new Error('Wrong parameters, need a new object or existing Text object');
            }

            this.scene.text.push(text);

            return text;
        },
        get: function () {

            if (!arguments.length) {
                return this.scene.text;
            }

            return utils.find(this.scene.text, arguments[0]);

        },
        remove: function () {
            var textToRemove = arguments[0] instanceof Text ? [arguments[0]] : this.text.get.apply(this, arguments),
                game = this;
            textToRemove.forEach(function (text) {
                game.scene.text.splice(game.scene.text.indexOf(text), 1);
            });
        }

    };

    // All methods are bound to game object
    Game.prototype.tilemap = {

        set: function () {
            var tilemap = this.tilemaps[arguments[0]] || arguments[0];
            if (tilemap && utils.isTilemap(tilemap)) {
                this.mapFile.set(tilemap);
            } else {
                throw new Error('There is no tilemap with the name ' + _id + ' loaded');
            }
        },
        get: function () {
            return this.map;
        },
        remove: function () {
            this.map = null;
        }

    };

    Game.prototype.trigger = function () {

        var type = arguments[0],
            args = Array.prototype.slice.call(arguments, 0),
            event;

        args.splice(0, 1);

        event = new CustomEvent(type, { detail: args });
        window.dispatchEvent(event);

    };

    Game.prototype.timeout = function (func, ms, context) {

        var funcString = func.toString();
        if (p.timeouts.indexOf(funcString) === -1) {
            setTimeout(function () {
                p.timeouts.splice(p.timeouts.indexOf(funcString), 1);
                func.call(context);
            }, ms);
            p.timeouts.push(funcString);
        }

    };


//    Game.prototype.cancelRequestAnimFrame = (function () {
//        return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout
//    })();

    return Game;

});