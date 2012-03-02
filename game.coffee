canvas = atom.canvas
canvas.width = 800
canvas.height = 600
ctx = atom.context
ctx.scale 1, -1
ctx.translate 0, -600
τ = Math.PI*2

game = null
window.onblur = -> game?.stop()
window.onfocus = -> game?.run()

randomDirection = ->
  r = Math.random() * 4
  return ['up','down','left','right'][Math.floor r]

class Game extends atom.Game
  arrowSize = 60
  constructor: ->
    @size = 10
    @grid = new Array(@size*@size)
    for i in [0...@grid.length]
      @grid[i] = randomDirection()
    @points = 0
  update: (dt) ->
    if atom.input.pressed 'click'
      mx = atom.input.mouse.x; my = 600 - atom.input.mouse.y
      gridx = Math.floor mx/arrowSize
      gridy = Math.floor my/arrowSize
      @clicked gridx, gridy
  clicked: (x, y) ->
    return unless 0 <= x < @size and 0 <= y < @size
    @grid[y*@size+x] = null
    round = 1
    loop
      break unless @resolveDuels(round++)
    @dirty = true
  resolveDuels: (round) ->
    # remove one round of duelists
    dead = []
    for y in [0...@size]
      for x in [0...@size]
        dir = @grid[y*@size+x]
        continue unless dir
        [dx,dy] = ({up:[0,1],down:[0,-1],left:[-1,0],right:[1,0]})[dir]
        px = x+dx
        py = y+dy
        distance = 0
        while px+dx < @size and py+dy < @size and px+dx >= 0 and py+dy >= 0
          break if @grid[py*@size+px]
          px += dx
          py += dy
          distance++
        opposite = {'up':'down','down':'up','left':'right','right':'left'}
        if distance > 0 and dir == opposite[@grid[py*@size+px]]
          dead.push [x,y], [px, py]
          @points += distance * round
    for [x,y] in dead
      @grid[y*@size+x] = null
    return dead.length

  draw: ->
    ctx.fillStyle = 'white'
    ctx.fillRect 0, 0, canvas.width, canvas.height
    for y in [0...@size]
      for x in [0...@size]
        g = @grid[y*@size+x]
        @drawArrow x, y, g if g
    ctx.save()
    ctx.scale 1,-1
    ctx.translate 800, -600
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.font = '20px KongtextRegular'
    ctx.fillStyle = 'black'
    ctx.fillText @points, -10, 10
    ctx.restore()
  drawArrow: (x, y, dir) ->
    ctx.save()
    ctx.translate (x+0.5)*arrowSize, (y+0.5)*arrowSize
    ctx.rotate ({right:0,up:τ/4,left:τ/2,down:τ*3/4})[dir]
    ctx.scale 0.7,0.7
    ctx.lineWidth = arrowSize*0.2
    ctx.beginPath()
    ctx.moveTo -arrowSize/2,0
    ctx.lineTo arrowSize/2,0
    ctx.moveTo 0,-arrowSize/2
    ctx.lineTo arrowSize/2,0
    ctx.lineTo 0,arrowSize/2
    ctx.strokeStyle = 'black'
    ctx.stroke()
    ctx.restore()

atom.input.bind atom.button.LEFT, 'click'

game = new Game
game.run()
