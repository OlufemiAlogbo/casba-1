import os
import json
from flask import Flask, render_template, url_for, request, redirect, session
from flask_socketio import SocketIO, emit
from watson_developer_cloud import ConversationV1
import urllib
import hashlib

# App config.
app = Flask(__name__)
app.config.from_object(__name__)
app.config['SECRET_KEY'] = 'dinosaurs'

socketio = SocketIO(app, async_mode='eventlet')
thread = None

# Watson Conversation
conversation = ConversationV1(
  username="4a23fe86-b0f6-4e1c-8dab-e707c2547b8c",
  password="0qO4k0TbbBsf",
  version='2017-05-26'
)

workspace_id = 'f7570f32-c417-41fe-b5b4-c7db19c893d1'

context = {}
last_response = ""

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
    user_ip = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    session['unique_conversation_id'] = str(user_ip) + "__" + str(user_agent)
    context["conversation_id"] = str(hashlib.sha256(session['unique_conversation_id'].encode('utf-8')).hexdigest())
    return render_template('chat.html', async_mode=socketio.async_mode)

# Websocket
@socketio.on('my event')
def handleMessage(message):
    from_human_message = str(message["data"])
    global context
    global response

    bot_response = "...."
    try:
        context["conversation_id"] = str(hashlib.sha256(session['unique_conversation_id'].encode('utf-8')).hexdigest())
        response = conversation.message(workspace_id=workspace_id, message_input={'text': urllib.unquote(from_human_message)}, context=context)
        context = response["context"]
        try:
            bot_response = ' '.join(response["output"]["text"])
        except Exception as ex:
            print("exception :( ", ex)

    except Exception as ex:
        print("watson exception :( ", ex)

    print("\n\nBOT SAYS: " + json.dumps(response))

    # sometimes the fucking bot doesn't answer what it should.
    if len(bot_response) < 2:
        bot_response = "I couldn't understand that. You can type 'help' for example"

    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my response', {'data': bot_response, 'count': session['receive_count']})

port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	#app.run(host='0.0.0.0', port=int(port), debug=True)
	socketio.run(app, host='0.0.0.0', port=int(port), debug=True)
