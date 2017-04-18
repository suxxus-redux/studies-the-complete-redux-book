/* eslint-disable no-alert, no-console */
const Redux = require('redux');

// ==========================
// Basic Redux Implementation
// using real Redux
// ==========================

// helpers
const inc = value => value + 1;
const dec = value => value - 1;

// constants
const INC = 'inc';
const DEC = 'dec';

// initial state
const initalState = {
    counter: 0
};

// reducer
// calculate a new state
const reducer = (state = {}, action) => {
    const actions = {
        [INC]: () => Object.assign({}, state, { counter: inc(state.counter) }),
        [DEC]: () => Object.assign({}, state, { counter: dec(state.counter) }),
        DEFAULT: () => state
    };

    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

// store
const store = Redux.createStore(reducer, initalState);

// module
const updateView = () => {
    console.log('counter: ', store.getState().counter);
};


const increment = () => store.dispatch({ type: INC });
const decrement = () => store.dispatch({ type: DEC });

store.subscribe(updateView);

module.exports = {
    increment,
    decrement
};
