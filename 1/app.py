import os
from flask import Flask, render_template, url_for, request, redirect
from flask_socketio import SocketIO, emit

# App config.
app = Flask(__name__)
app.config.from_object(__name__)
app.config['SECRET_KEY'] = 'dinosaurs'

socketio = SocketIO(app)

# Views
@app.route("/", methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        j=request.form['j']
        if j != "":
            return redirect(url_for('chat', messages=j))
        else:
            return render_template('index.html')

    return render_template('index.html')

@app.route('/chat')
def chat():
    return render_template("chat.html")

# Websocket
@socketio.on('my event')
def handleMessage(message):
    print('Message: ' + message["data"])
    emit('my response', {'data': message["data"]})

port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	#app.run(host='0.0.0.0', port=int(port), debug=True)
	socketio.run(app, host='0.0.0.0', port=int(port), debug=True)
