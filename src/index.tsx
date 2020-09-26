import React from "react";
import ReactDOM from "react-dom";
import "./index.css"

type SquareProps = {
    marker: string|null
    onClick: () => void
}

function Square(props: SquareProps) {
        return (
            <button 
                className="square" 
                onClick={ props.onClick }
            >
                {props.marker}
            </button>
        );
}


type BoardProps = {
    squares: Array<string>
    xIsNext: boolean
    onClick: (i: number) => void
}

type BoardState = {
    squares: Array<string>
}

class Board extends React.Component<BoardProps, BoardState> {

    renderSquare(i: number) {
        return (
            <Square 
                marker={this.props.squares[i]}
                onClick={ () => this.props.onClick(i) }
            />
        )
    }

    render() {
        return (
            <div>
                <div className="board-row">
                    {this.renderSquare(0)}
                    {this.renderSquare(1)}
                    {this.renderSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderSquare(3)}
                    {this.renderSquare(4)}
                    {this.renderSquare(5)}
                </div>
                <div className="board-row">
                    {this.renderSquare(6)}
                    {this.renderSquare(7)}
                    {this.renderSquare(8)}
                </div>
            </div>
        );
    }

}

type GameProps = {}
type GameState = {
    history: Array<{ squares: Array<string> }>
    stepNumber: number
    xIsNext: boolean
}

class Game extends React.Component<GameProps, GameState> {

    constructor(props: GameProps) {
        super(props)
        this.state = {
            history: [{ squares: Array(9).fill(null) }],
            stepNumber: 0,
            xIsNext: true
        }
    }

    handleClick(i: number) {
        const history: Array<{ squares: Array<string> }> = this.state.history.slice(0, this.state.stepNumber + 1)
        const current: { squares: Array<string>} = history[history.length - 1];
        const squares: Array<string> = current.squares.slice(); // Slice will create a copy
        if (calculateWinner(squares) || squares[i]) { return; }
        squares[i] = this.state.xIsNext ? "X" : "O";
        this.setState({ 
            history: history.concat([{
                squares: squares
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext
        });
    }

    jumpTo(idx: number) {
        this.setState({
            stepNumber: idx,
            xIsNext: (idx % 2) == 0
        });
    }

    render() {
        const history: Array<{ squares: Array<string> }> = this.state.history
        const current: { squares: Array<string>} = history[this.state.stepNumber];
        const winner: string | null = calculateWinner(current.squares);

        const moves = history.map(
            (state: { squares: Array<string> }, idx: number) => {
                const desc: string = idx ? "Go to move #" + idx : "Go to game start"
                return (
                    <li key={idx}>
                        <button onClick={() => this.jumpTo(idx)}>{desc}</button>
                    </li>
                )
            }
        )

        let status: string;
        if (winner) {
            status = "Winner: " + winner;
        } else {
            status = "Next Player: " + (this.state.xIsNext ? "X" : "O");
        }

        return (
            <div className="game">
                <div className="game-board">
                    <Board 
                        squares={current.squares}
                        onClick={ (i: number) => this.handleClick(i)}
                        xIsNext={this.state.xIsNext}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <ol>{moves}</ol>
                </div>
            </div>
        );
    }

}

function calculateWinner(squares: Array<string>) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

ReactDOM.render(<Game />, document.getElementById("root"));