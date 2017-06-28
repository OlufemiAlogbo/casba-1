#!flask/bin/python
from flask import Flask, render_template, url_for, request, flash

# App config.
app = Flask(__name__)
app.config.from_object(__name__)
app.config['SECRET_KEY'] = 'dinosaurs'

@app.route("/", methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        j=request.form['j']
        if j != "":
            return render_template('kira.html', j=j)
        else:
            return render_template('index.html')

    return render_template('index.html')

@app.route('/kira')
def kira():
    return render_template("kira.html")

if __name__ == '__main__':
    app.run(debug=True)
