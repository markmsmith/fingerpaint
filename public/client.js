(function() {
  window.Fingerpaint = {};

  Fingerpaint.Client = (function() {
    function Client() {
      var _this = this;

      this.users = {};
      this.socket = io.connect("http://" + document.location.hostname + "/");
      this.canvas = $('#draw');
      this.viewport = $(window);
      this.resizeCanvas();
      this.viewport.resize(function() {
        return _this.resizeCanvas();
      });
      this.socket.on('hello', function(me, users) {
        var id, user, _results;

        _this.me = me;
        _results = [];
        for (id in users) {
          user = users[id];
          _results.push(_this.addUser(user));
        }
        return _results;
      });
      this.socket.on('join', function(user) {
        return _this.addUser(user);
      });
      this.socket.on('part', function(user) {
        return _this.removeUser(user);
      });
      this.socket.on('move', function(id, position, drawing) {
        var user;

        user = _this.users[id];
        return _this.moveUser(user, position, drawing);
      });
      this.socket.on('nick', function(id, nick) {
        var user;

        user = _this.users[id];
        return _this.changeNick(user, nick);
      });
      $(document).mousemove(_.throttle(function(event) {
        var position;

        console.log('mousemove');
        position = {
          x: event.pageX,
          y: event.pageY
        };
        return _this.handleMove(position);
      }, 50));
      $(document).mousedown(function(event) {
        console.log('mousedown');
        return _this.drawing = true;
      });
      $(document).mouseup(function(event) {
        console.log('mouseup');
        return _this.drawing = false;
      });
      $(document).on({
        'touchstart': function(event) {
          console.log('touchstart');
          return _this.drawing = true;
        }
      });
      $(document).on({
        'touchend': function(event) {
          console.log('touchend');
          return _this.drawing = false;
        }
      });
      $(document).on({
        'touchmove': _.throttle(function(event) {
          var position, touch;

          console.log('touchmove');
          event.preventDefault();
          touch = event.originalEvent.touches[0];
          position = {
            x: touch.pageX,
            y: touch.pageY
          };
          return _this.handleMove(position);
        }, 50)
      });
      $(document).keyup(function(event) {
        var nick;

        if (event.keyCode === 78) {
          nick = prompt("what's your name?");
          return _this.socket.emit('nick', nick);
        }
      });
    }

    Client.prototype.handleMove = function(position) {
      return this.socket.json.emit('move', position, this.drawing);
    };

    Client.prototype.resizeCanvas = function() {
      return this.canvas.attr({
        width: this.viewport.width(),
        height: this.viewport.height()
      });
    };

    Client.prototype.addUser = function(user) {
      this.users[user.id] = {
        id: user.id,
        color: user.color,
        avatar: this.createAvatar(user)
      };
      return this.updateStatus();
    };

    Client.prototype.changeNick = function(user, nick) {
      user.nick = nick;
      return $('.nick', user.avatar).html(nick);
    };

    Client.prototype.updateStatus = function() {
      var count, key;

      count = ((function() {
        var _results;

        _results = [];
        for (key in this.users) {
          _results.push(key);
        }
        return _results;
      }).call(this)).length;
      return $('#status').html("" + count + " " + (count === 1 ? 'user' : 'users') + " connected");
    };

    Client.prototype.removeUser = function(user) {
      var avatar;

      avatar = this.users[user.id].avatar;
      avatar.remove();
      delete this.users[user.id];
      return this.updateStatus();
    };

    Client.prototype.moveUser = function(user, position, drawing) {
      var ctx, offset, old;

      if (drawing) {
        offset = user.avatar.position();
        old = {
          x: offset.left + 8,
          y: offset.top + 8
        };
        ctx = this.canvas.get(0).getContext('2d');
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(" + user.color + ", 0.8)";
        ctx.beginPath();
        ctx.moveTo(old.x, old.y);
        ctx.lineTo(position.x, position.y);
        ctx.closePath();
        ctx.stroke();
      }
      return user.avatar.css({
        left: "" + (position.x - 8) + "px",
        top: "" + (position.y - 8) + "px"
      });
    };

    Client.prototype.createAvatar = function(user) {
      var avatar, canvas, ctx, nick;

      avatar = $("<div class='avatar' id='user-" + user.id + "'/>").appendTo('body');
      canvas = $('<canvas/>').attr({
        width: 16,
        height: 16
      }).appendTo(avatar);
      ctx = canvas.get(0).getContext('2d');
      ctx.lineWidth = 0.5;
      ctx.fillStyle = "rgba(" + user.color + ", 0.2)";
      ctx.strokeStyle = "rgba(" + user.color + ", 1)";
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      nick = $("<div class='nick'>" + user.id + "</div>").appendTo(avatar);
      nick.css('color', "rgba(" + user.color + ", 1)");
      return $(avatar);
    };

    return Client;

  })();

}).call(this);
