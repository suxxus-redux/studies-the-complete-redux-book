/* eslint no-console: ["off"] */
/* eslint one-var: ["off"] */

const bodyparser = require('body-parser'),
    fs = require('fs'),
    compression = require('compression'),
    cors = require('cors'),
    express = require('express'),
    path = require('path'),
    http = require('http'),
    socketio = require('socket.io');

const port = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(compression());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// api
const getJsonFromFile = file =>
    fs.readFileSync(file, 'utf8', (err, data) => {
        if (err) {
            throw err;
        }
        return JSON.parse(data);
    });

app.get('/api/recipes', (req, res) => {
    const file = path.format({
        dir: path.join(__dirname, 'data'),
        base: 'recipes.json',
    });
    console.log('--> recipes.json');
    res
        .status(200)
        .send(getJsonFromFile(file));
});

// IO
io.on('connection', (socket) => {
    socket.on('ws.to.server', ({ payload = '', type = '' }) => {
        const actions = {
            'ws.connected': () => socket.emit('from.server', { type: 'ws.message', payload: 'hello from server' }),
            default: () => socket.emit('from.server', { type: 'ws.disconnect', payload: '' })
        };

        const doAction = actions[type] || actions.default;
        doAction();
    });
});

server.listen(8080, () => {
    const host = server.address().address;
    console.log('Example app listening at http://%s:%s', host, port);
});
