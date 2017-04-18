/* eslint-disable no-alert, no-console */

// ==========================
// Basic Redux Implementation
// ==========================


// initial state
let appState = {
    counter: 0
};

// list of all the registered callbacks
let listeners = [];


// constants
const INC = 'inc';
const DEC = 'dec';

// helpers
const inc = value => value + 1;
const dec = value => value - 1;

const subscribe = callback => {
    listeners = listeners.concat(callback);
};

const updateView = () => {
    const {
        counter
    } = appState;

    console.log('counter: ', counter);
};

// reducer
// calculate a new state
const reducer = (state = {}, action) => {
    const actions = {
        [INC]: () => Object.assign({}, appState, { counter: inc(state.counter) }),
        [DEC]: () => Object.assign({}, appState, { counter: dec(state.counter) }),
        DEFAULT: () => state
    };

    const doAction = actions[action] || actions.DEFAULT;

    return doAction();
};

// check if the new state differs from the old one,
// and if it does, we replace the old state and notify
// all the listeners of the change
const dispatch = action => {
    const newState = reducer(appState, action);
    const statesNotEq = JSON.stringify(newState) !== JSON.stringify(appState);

    if (statesNotEq) {
        appState = newState;
    }

    listeners.forEach(listener => listener());
};

const increment = () => dispatch(INC);
const decrement = () => dispatch(DEC);

subscribe(updateView);

module.exports = {
    increment,
    decrement
};
