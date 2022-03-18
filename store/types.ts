export type ChangeHandler<STATE> = (previous: STATE, next: STATE) => void
export type Reducer<STATE, ACTION> = (state: STATE, action: ACTION) => STATE;
export type Derivator<STATE, DERIVATE> = (state: STATE) => DERIVATE