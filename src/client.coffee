window.Fingerpaint = {}

class Fingerpaint.Client

	constructor: ->

		@users = {}
		@socket = io.connect "http://#{document.location.hostname}/"

		@canvas = $('#draw')
		@viewport = $(window)

		@resizeCanvas()
		@viewport.resize =>
			@resizeCanvas()

		@socket.on 'hello', (me, users) =>
			@me = me
			@addUser(user) for id, user of users

		@socket.on 'join', (user) =>
			@addUser(user)

		@socket.on 'part', (user) =>
			@removeUser(user)

		@socket.on 'move', (id, position, drawing) =>
			user = @users[id]
			@moveUser user, position, drawing

		@socket.on 'nick', (id, nick) =>
			user = @users[id]
			@changeNick user, nick

		$(document).mousemove _.throttle((event) =>
			console.log('mousemove')
			position =
				x: event.pageX
				y: event.pageY
			@handleMove position
		, 50)

		$(document).mousedown (event) =>
			console.log('mousedown')
			@drawing = true

		$(document).mouseup (event) =>
			console.log('mouseup')
			@drawing = false

		$(document).on 'touchstart': (event) =>
			console.log('touchstart')
			@drawing = true

		$(document).on 'touchend': (event) =>
			console.log('touchend')
			@drawing = false

		$(document).on 'touchmove': _.throttle((event) =>
			console.log('touchmove')
			event.preventDefault();
			touch = event.originalEvent.touches[0];
			position =
				x: touch.pageX
				y: touch.pageY
			@handleMove position
		, 50)

		$(document).keyup (event) =>
			if event.keyCode is 78
				nick = prompt "what's your name?"
				@socket.emit 'nick', nick

	handleMove: (position) ->
		@socket.json.emit 'move', position, @drawing

	resizeCanvas: ->
		@canvas.attr
			width: @viewport.width()
			height: @viewport.height()

	addUser: (user) ->
		@users[user.id] =
			id:     user.id
			color:  user.color
			avatar: @createAvatar(user)
		@updateStatus()

	changeNick: (user, nick) ->
		user.nick = nick
		$('.nick', user.avatar).html(nick)

	updateStatus: ->
		count = (key for key of @users).length
		$('#status').html("#{count} #{if count is 1 then 'user' else 'users'} connected")

	removeUser: (user) ->
		avatar = @users[user.id].avatar
		avatar.remove()
		delete @users[user.id]
		@updateStatus()

	moveUser: (user, position, drawing) ->

		if drawing
			offset = user.avatar.position()

			old =
				x: offset.left + 8
				y: offset.top + 8

			ctx = @canvas.get(0).getContext('2d')
			ctx.lineWidth = 3
			ctx.strokeStyle = "rgba(#{user.color}, 0.8)"
			ctx.beginPath()
			ctx.moveTo(old.x, old.y)
			ctx.lineTo(position.x, position.y)
			ctx.closePath()
			ctx.stroke()

		user.avatar.css
			left: "#{position.x - 8}px"
			top:  "#{position.y - 8}px"

	createAvatar: (user) ->

		avatar = $("<div class='avatar' id='user-#{user.id}'/>").appendTo('body')
		canvas = $('<canvas/>').attr(width: 16, height: 16).appendTo(avatar)

		ctx = canvas.get(0).getContext('2d')
		ctx.lineWidth = 0.5
		ctx.fillStyle = "rgba(#{user.color}, 0.2)"
		ctx.strokeStyle = "rgba(#{user.color}, 1)"
		ctx.beginPath()
		ctx.arc(8, 8, 6, 0, Math.PI * 2, true)
		ctx.closePath()
		ctx.fill()
		ctx.stroke()

		nick = $("<div class='nick'>#{user.id}</div>").appendTo(avatar)
		nick.css 'color', "rgba(#{user.color}, 1)"

		return $(avatar)