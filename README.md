# Chesh

Chess.com's broadcasts only focus on tournaments that involve top 10 players, supplying their broadcasts with commentary teams, and putting them on chesstv. This means many of the semi-elite tournaments that include some of the most interesting chess players in the top 50 (Esipenko, Harikrishna, etc.) are difficult to discover. 

Chesh is a TUI to access, save and analyze lichess broadcasts for these tournaments. 

<img width="2218" height="1157" alt="image" src="https://github.com/user-attachments/assets/23bb090f-26f2-4a1f-944b-5214abf91cd7" />

## Installation

```bash
bun install -g chesh
```

## Usage

```bash
chesh
```

Optional: Set environment variable (10 extra requests per second with the token):
```bash
export LICHESS_TOKEN=your-token
```

## License

MIT

# Acknowledgements

- [Chess TUI](https://github.com/thomas-mauran/chess-tui) for the piece maps 
- [Chess]( https://github.com/Darokahn/Chess ) for additional piece maps
- [Ink](https://github.com/vadimdemedes/ink) for the awesome TUI framework
- Lichess for access to its public API
