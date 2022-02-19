import * as hooks from 'preact/hooks';

export function useRerender() {
    const [_, setState] = hooks.useState({});

    return rerender;

    function rerender() {
        setState({});
    }
}
