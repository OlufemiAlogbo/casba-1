import os
from flask import Flask, render_template, url_for, request, redirect

# App config.
app = Flask(__name__)
app.config.from_object(__name__)
app.config['SECRET_KEY'] = 'dinosaurs'

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

port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	app.run(host='0.0.0.0', port=int(port), debug=True)
