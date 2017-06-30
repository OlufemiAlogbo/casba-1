import os
import json
from flask import Flask, render_template, url_for, request, redirect, session
from flask_socketio import SocketIO, emit
from watson_developer_cloud import ConversationV1
import urllib
import hashlib
import ibm_db
import pandas
import ibm_db_dbi
import datetime
from flutterwave import Flutterwave

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

# DashDB
#Enter the values for you database connection
dsn_driver = "IBM DB2 ODBC DRIVER"
dsn_database = "BLUDB"
dsn_hostname = "dashdb-entry-yp-lon02-01.services.eu-gb.bluemix.net"
dsn_port = "50000"
dsn_protocol = "TCPIP"
dsn_uid = "dash8359"
dsn_pwd = "0e_yj2GJ_BLj"

dsn = (
    "DRIVER={{IBM DB2 ODBC DRIVER}};"
    "DATABASE={0};"
    "HOSTNAME={1};"
    "PORT={2};"
    "PROTOCOL=TCPIP;"
    "UID={3};"
    "PWD={4};").format(dsn_database, dsn_hostname, dsn_port, dsn_uid, dsn_pwd)

conn = ibm_db.connect(dsn, "", "")

pconn = ibm_db_dbi.Connection(conn)

# Flutterwave
flw = Flutterwave("", "", {"debug": True})


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
    global bvn_response
    global otp_response

    intent = " "
    entity = " "
    form = " "
    bot_response = "...."
    user = "..."
    try:
        context["conversation_id"] = str(hashlib.sha256(session['unique_conversation_id'].encode('utf-8')).hexdigest())
        response = conversation.message(workspace_id=workspace_id, message_input={'text': urllib.unquote(from_human_message)}, context=context)
        context = response["context"]

        if len(json.loads(json.dumps(response, indent=2))['intents']) > 0:
            intent = json.loads(json.dumps(response, indent=2))['intents'][0]['intent']
            if len(json.loads(json.dumps(response, indent=2))['output']['text']) != 0:
                try:
                    bot_response = ' '.join(response["output"]["text"])
                except Exception as ex:
                    print("exception :( ", ex)
        elif len(json.loads(json.dumps(response, indent=2))['entities']) > 0:
            entity = json.loads(json.dumps(response, indent=2))['entities'][0]['value']
            if entity == "BVN":
                bvn = str(json.loads(json.dumps(response, indent=2))['context']['bvn'].split()[1])
                verifyUsing = "Voice"
                country = "NGN"

                r = flw.bvn.verify(bvn, verifyUsing, country)
                bvn_response = json.loads("{0}".format(r.text))
                if len(json.loads(json.dumps(response, indent=2))['output']['text']) != 0:
                    try:
                        bot_response = ' '.join(response["output"]["text"])
                    except Exception as ex:
                        print("exception :( ", ex)
            else:
                if len(json.loads(json.dumps(response, indent=2))['output']['text']) != 0:
                    try:
                        bot_response = ' '.join(response["output"]["text"])
                    except Exception as ex:
                        print("exception :( ", ex)
        else:
            if len(json.loads(json.dumps(response, indent=2))['context']['otp']) == 5:
                bvn = str(json.loads(json.dumps(response, indent=2))['context']['bvn'].split()[1])
                otp = str(json.loads(json.dumps(response, indent=2))['context']['otp'])
                transactionReference = str(bvn_response["data"]["transactionReference"])
                country = "NGN"

                r = flw.bvn.validate(bvn, otp, transactionReference, country)
                otp_response = json.loads("{0}".format(r.text))
                user = otp_response["data"]
                form = "signup"
                if len(json.loads(json.dumps(response, indent=2))['output']['text']) != 0:
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
    emit('my response', {'data': bot_response, 'intent': intent, 'entity': entity, 'user': user, 'form': form, 'count': session['receive_count']})

    # sql = "INSERT INTO CONVERSATION (ID, MESSAGE, INTENT, TOC) VALUES (?, ?, ?, ?)"
    # stmt = ibm_db.prepare(conn, sql)
    # param = str(context["conversation_id"]).encode('ascii', 'ignore').decode('ascii'), str(bot_response).encode('ascii', 'ignore').decode('ascii'), str(intent).encode('ascii', 'ignore').decode('ascii'), str(datetime.datetime.utcnow()).encode('ascii', 'ignore').decode('ascii'),
    # ibm_db.execute(stmt, param)

    #conversation_log = pandas.read_sql('SELECT * FROM CONVERSATION', pconn)

port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	#app.run(host='0.0.0.0', port=int(port), debug=True)
	socketio.run(app, host='0.0.0.0', port=int(port), debug=True)
