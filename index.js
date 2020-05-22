const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron')

let win
let savedWindowBoundsForTogglingFullScreen = {}
let savedWindowBoundsBeforeDragging = {}
let savedMouseDownPositionBeforeDragging
let isMaximized = false
let isMouseDragging = false
let opacity = 0.4
let dOpacity = 0.1

function createWindow() {
	win = new BrowserWindow({
		width: 640,
		height: 480,
		transparent: true,
		alwaysOnTop: true,
		resizable: true,
		fullscreenable: false,
		opacity: true,
		frame: false,
		webPreferences: {
			nodeIntegration: true
		}
	})

	savedWindowBoundsForTogglingFullScreen = win.getBounds()

	ipcMain.on('mousedown', (e, mousePosition) => {
		isMouseDragging = true
		savedWindowBoundsBeforeDragging = win.getBounds()
		savedMouseDownPositionBeforeDragging = mousePosition
	})

	ipcMain.on('mouseup', () => {
		isMouseDragging = false
	})

	ipcMain.on('mousemove', (e, mousePosition) => {
		if (isMouseDragging && !isMaximized) {
			let offsetX = mousePosition.x - savedMouseDownPositionBeforeDragging.x
			let offsetY = mousePosition.y - savedMouseDownPositionBeforeDragging.y
			let x = savedWindowBoundsBeforeDragging.x + offsetX
			let y = savedWindowBoundsBeforeDragging.y + offsetY
			win.setPosition(x, y)
			console.log(x, y)
			win.setSize(savedWindowBoundsBeforeDragging.width, savedWindowBoundsBeforeDragging.height)
		}
	})

	ipcMain.on('dblclick', () => {
		toggleFullScreen()
	})

	ipcMain.on('renderer-loaded', () => {
		win.webContents.send('update-opacity', opacity)
	})

	win.loadFile('src/index.html')
	win.menuBarVisible = false
	win.setAlwaysOnTop(true)

	win.on('maximize', (e) => {
		onMaximize()
	})
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
	app.quit()
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		if (win) {
			if (win.isMinimized()) win.restore()
			win.focus()
		}
	})

	app.on('ready', () => {})
}

app.on('ready', () => {
	setTimeout(function() {
		createWindow()
		toggleFullScreen()
	}, 1000)

	globalShortcut.register('Alt+F4', () => {
		win.show()
	})

	globalShortcut.register('CommandOrControl+Alt+F', () => {
		toggleFullScreen()
	})

	globalShortcut.register('CommandOrControl+Alt+1', () => {
		opacity -= dOpacity
		if (opacity < 0.1) opacity = 0.1
		win.webContents.send('update-opacity', opacity)

		if (isMaximized) {
			win.setIgnoreMouseEvents(true)
		} else {
			win.setIgnoreMouseEvents(false)
		}
	})

	globalShortcut.register('CommandOrControl+Alt+2', () => {
		opacity += dOpacity
		if (opacity > 1) opacity = 1
		win.webContents.send('update-opacity', opacity)

		if (Math.abs(opacity - 1) < 0.01) {
			win.setIgnoreMouseEvents(false)
		}
	})

	globalShortcut.register('Ctrl+Alt+F4', () => {
		app.quit()
	})

	globalShortcut.register('Ctrl+Esc', () => {
		app.quit()
	})

	globalShortcut.register('Ctrl+Alt+H', () => {
		if (win.isVisible()) {
			win.hide()
		} else {
			win.show()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})

function onMaximize() {
	isMaximized = true
	win.setIgnoreMouseEvents(true)
	savedWindowBoundsForTogglingFullScreen = win.getBounds()
	win.setSize(screen.getPrimaryDisplay().bounds.width + 1, screen.getPrimaryDisplay().bounds.height)
	win.setPosition(0, 0)
}

function onMinimize() {
	isMaximized = false
	win.setIgnoreMouseEvents(false)
	win.setSize(savedWindowBoundsForTogglingFullScreen.width, savedWindowBoundsForTogglingFullScreen.height)
	win.setPosition(savedWindowBoundsForTogglingFullScreen.x, savedWindowBoundsForTogglingFullScreen.y)
}

function toggleFullScreen() {
	if (isMaximized) {
		onMinimize()
		win.setIgnoreMouseEvents(false)
	} else {
		onMaximize()
		if (opacity == 1) {
			win.setIgnoreMouseEvents(false)
		} else {
			win.setIgnoreMouseEvents(true)
		}
	}
}
