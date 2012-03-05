canvas = atom.canvas
canvas.width = 800
canvas.height = 600
ctx = atom.context
ctx.scale 1, -1
ctx.translate 0, -600
τ = Math.PI*2

FONT = 'SnigletRegular'

game = null

D = {up:[0,1],down:[0,-1],left:[-1,0],right:[1,0]}
opposite = {'up':'down','down':'up','left':'right','right':'left'}

randomDirection = ->
  r = Math.random() * 4
  return ['up','down','left','right'][Math.floor r]

generateGrid = (size) ->
  oneGrid = ->
    grid = new Array(size*size)
    for i in [0...grid.length]
      grid[i] = randomDirection()
    loop
      break unless removeUselessGuys(grid, size)
    grid
  count = (g) ->
    n = 0
    n++ for d,i in g when d
    n
  loop
    g = oneGrid()
    return g if count(g) >= 0.9*size*size

removeUselessGuys = (grid, size) ->
  canDuel = (x, y) ->
    dir = grid[x+y*size]
    [dx,dy] = D[dir]
    duelFound = false
    cx = x+dx*2; cy = y+dy*2
    while 0 <= cx < size and 0 <= cy < size
      if grid[cx+cy*size] == opposite[dir]
        duelFound = true
        break
      cx += dx
      cy += dy
    return duelFound
  canBlock = (x, y) ->
    dir = grid[x+y*size]
    allLeft = (grid[xp+y*size] for xp in [0...x]) ? []
    allRight = (grid[xp+y*size] for xp in [x+1...size]) ? []
    return true if 'right' in allLeft and 'left' in allRight
    allDown = (grid[x+yp*size] for yp in [0...y]) ? []
    allUp = (grid[x+yp*size] for yp in [y+1...size]) ? []
    return true if 'up' in allDown and 'down' in allUp
    false
  dead = 0
  for y in [0...size]
    for x in [0...size]
      continue unless grid[x+y*size]
      unless canBlock(x,y) or canDuel(x,y)
        grid[x+y*size] = null
        dead++
  return dead

class ScoreText
  constructor: (@x, @y, @score, @round) ->
    @t = @age = 0
    @maxAge = 1
  update: (dt) ->
    @age += dt
    @t = @age/@maxAge
  font: -> "#{20+@round*5}px #{FONT}, sans-serif"
  draw: ->
    ctx.save()
    ctx.translate @x, @y
    ctx.scale 1,-1
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = @font()
    ctx.fillStyle = "rgba(255,0,0,#{1-@t})"
    ctx.fillText @score*@round, 0, -@t*20
    ctx.restore()
  alive: -> @t <= 1

arrowSize = 60
class Game extends atom.Game
  constructor: ->
    @size = 10
    @grid = generateGrid @size
    @points = 0
    @dirty = true
    @state = 'entering'
    @time = 0
    @animTime = 0.6
    @round = 1
    @particles = []
  update: (dt) ->
    @dirty = true if @particles.length > 0
    p.update dt for p in @particles
    i = 0
    while i < @particles.length
      p = @particles[i]
      if not p.alive()
        @particles[i] = @particles[@particles.length-1]
        @particles.length--
      else
        i++
    switch @state
      when 'entering'
        @time += dt
        if @time >= 0.2
          @state = 'ready'
        @dirty = true
      when 'ready'
        if atom.input.pressed 'click'
          mx = atom.input.mouse.x; my = 600 - atom.input.mouse.y
          gridx = Math.floor mx/arrowSize
          gridy = Math.floor my/arrowSize
          @clicked gridx, gridy
      when 'animating'
        if (@time+=dt) >= @animTime
          @time = 0
          if @resolveDuels()
            @dirty = true
          else
            @state = 'ready'
            @round = 1
  clicked: (x, y) ->
    return unless 0 <= x < @size and 0 <= y < @size
    return unless @grid[y*@size+x]
    @grid[y*@size+x] = null
    if @duelsExist()
      @state = 'animating'
      @time = 0
    @dirty = true
  duelsExist: -> @resolveDuels false
  resolveDuels: (die=true) ->
    # remove one round of duelists
    dead = []
    deadSet = {}
    for y in [0...@size]
      for x in [0...@size]
        dir = @grid[y*@size+x]
        continue unless dir
        continue if [x,y] of deadSet
        [dx,dy] = ({up:[0,1],down:[0,-1],left:[-1,0],right:[1,0]})[dir]
        px = x+dx
        py = y+dy
        distance = 0
        while px+dx < @size and py+dy < @size and px+dx >= 0 and py+dy >= 0
          break if @grid[py*@size+px]
          px += dx
          py += dy
          distance++
        if distance > 0 and dir == opposite[@grid[py*@size+px]]
          dead.push [x,y], [px, py]
          deadSet[[x,y]] = deadSet[[px,py]] = true
          if die
            @points += distance * @round
            midx = (0.5+(x+px)/2)*arrowSize; midy = (0.5+(y+py)/2)*arrowSize
            midx += (Math.random()*2-1)*arrowSize*0.4
            midy += (Math.random()*2-1)*arrowSize*0.4
            @particles.push new ScoreText midx, midy, distance, @round
    if die
      for [x,y] in dead
        @grid[y*@size+x] = null
      @round++ if dead.length > 0
    return dead.length

  draw: ->
    return unless @dirty
    ctx.globalAlpha = 1
    ctx.fillStyle = 'white'
    ctx.fillRect 0, 0, canvas.width, canvas.height
    if @state == 'entering'
      ctx.globalAlpha = @time/0.2
    for y in [0...@size]
      for x in [0...@size]
        g = @grid[y*@size+x]
        @drawArrow x, y, g if g
    p.draw() for p in @particles
    ctx.save()
    ctx.scale 1,-1
    ctx.translate 800, -600
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.font = "40px #{FONT}, sans-serif"
    ctx.fillStyle = 'black'
    ctx.fillText "#{@points}", -10, 10
    ctx.restore()
    @dirty = false
  duelling: (x, y) ->
    dir = @grid[y*@size+x]
    return false unless dir
    [dx,dy] = D[dir]
    px = x+dx
    py = y+dy
    distance = 0
    while 0 <= px+dx < @size and 0 <= py+dy < @size
      break if @grid[py*@size+px]
      px += dx; py += dy
      distance++
    distance >= 1 and @grid[py*@size+px] == opposite[dir]
  drawArrow: (x, y, dir) ->
    ctx.save()
    ctx.translate (x+0.5)*arrowSize, (y+0.5)*arrowSize
    ctx.rotate ({right:0,up:τ/4,left:τ/2,down:τ*3/4})[dir]
    ctx.scale 0.6,0.6
    ctx.lineWidth = arrowSize*0.3
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo -arrowSize/2,0
    ctx.lineTo arrowSize/2,0
    ctx.moveTo 0,-arrowSize/2
    ctx.lineTo arrowSize/2,0
    ctx.lineTo 0,arrowSize/2
    ctx.strokeStyle = if @duelling(x,y) then 'red' else 'black'
    ctx.stroke()
    ctx.restore()

arrowPath = ->
  ctx.lineWidth = arrowSize*0.3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo -arrowSize/2,0
  ctx.lineTo arrowSize/2,0
  ctx.moveTo 0,-arrowSize/2
  ctx.lineTo arrowSize/2,0
  ctx.lineTo 0,arrowSize/2

atom.input.bind atom.button.LEFT, 'click'

class Title extends atom.Game
  constructor: ->
    super()
    @time = 0
    @enterTime = 0

  update: (dt) ->
    @time += dt
    if not @entering
      if atom.input.pressed 'click'
        @entering = true
    else
      @enterTime += dt
      if @enterTime >= 2
        game = new Game
        @stop()
        game.run()

  draw: ->
    ctx.globalAlpha = 1
    ctx.fillStyle = 'white'
    ctx.fillRect 0, 0, canvas.width, canvas.height
    if @enterTime >= 1.8
      ctx.globalAlpha = (2-@enterTime)/0.2
    ctx.save()
    ctx.translate canvas.width/2, canvas.height/2
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.scale 1,-1
    ctx.font = "90px #{FONT}, sans-serif"
    ctx.fillStyle = 'black'
    ctx.fillText 'STAND', -91, 0
    c = Math.cos @time*4
    ctx.fillStyle = "rgba(0, 0, 0, #{0.8+c*0.2})"
    if @enterTime <= 0.1
      ctx.fillText 'O', 105, 0
    ctx.fillStyle = 'black'
    ctx.fillText 'FF', 196, 0
    ctx.restore()

    if @enterTime < 0.1
      ctx.strokeStyle = 'black'
    else
      ctx.strokeStyle = 'red'
    if @enterTime < 1.2
      # down arrow
      ctx.save()
      ctx.translate 505, 380
      ctx.rotate 3*τ/4
      ctx.scale 0.8, 0.8
      arrowPath()
      ctx.stroke()
      ctx.restore()

      # up arrow
      ctx.save()
      ctx.translate 505, 150
      ctx.rotate τ/4
      ctx.scale 0.8, 0.8
      arrowPath()
      ctx.stroke()
      ctx.restore()
game = new Title
window.onload = ->
  window.onblur = -> game?.stop()
  window.onfocus = -> game?.run()
  game.run()
