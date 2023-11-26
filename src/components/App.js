import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const KEY = "af135218";

export default function App() {
    const [movies, setMovies] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedMovieId, setSelectedMovieId] = useState(null);
    //const [watched, setWatched] = useState([]);
    const [watched, setWatched] = useState(function () {
        return localStorage.getItem("watched")
            ? JSON.parse(localStorage.getItem("watched"))
            : [];
    });

    const selectedMovieInWatchList = watched
        .map((m) => m.imdbID)
        .includes(selectedMovieId);
    const selectedMovieUserRating = watched.find(
        (m) => m.imdbID === selectedMovieId
    )?.userRating;

    function handleSelectMovie(id) {
        setSelectedMovieId((selectedMovieId) =>
            id === selectedMovieId ? null : id
        );
    }

    function handleCloseMovieDetail() {
        setSelectedMovieId(null);
    }

    function handleAddWatchedMovie(movie) {
        setWatched((watched) => [...watched, movie]);

        // localStorage.setItem("watched", JSON.stringify([...watched, movie]));
    }

    function handleDeleteWatchedMovie(id) {
        setWatched((watched) => watched.filter((m) => m.imdbID !== id));
        setSelectedMovieId(null);
    }

    useEffect(
        function () {
            localStorage.setItem("watched", JSON.stringify(watched));
        },
        [watched]
    );

    useEffect(
        function () {
            const controller = new AbortController(); // Native browser controller

            async function fetchMovies() {
                try {
                    setError("");
                    setLoading(true);

                    const response = await fetch(
                        `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
                        { signal: controller.signal }
                    );

                    if (!response.ok)
                        throw new Error(
                            `Something went wrong: ${response.statusText}`
                        );

                    const data = await response.json();

                    if (data.Response === "False")
                        throw new Error("Movie not found!"); // Movie not found

                    setMovies(data?.Search);
                } catch (err) {
                    if (err.name !== "AbortError") {
                        setError(err.message);
                    }
                } finally {
                    setLoading(false);
                }
            }

            if (query.length < 3) {
                setMovies([]);
                setError("");
                return;
            }

            handleCloseMovieDetail();
            fetchMovies();

            return function () {
                controller.abort();
            };
        },
        [query]
    );

    return (
        <>
            <nav className="nav-bar">
                <Logo />
                <Search query={query} setQuery={setQuery} />
                <NumResults numMovies={movies?.length} />
            </nav>
            <main className="main">
                {loading && <Loader />}
                {!loading && !error && (
                    <ListBox
                        movies={movies}
                        onSelectMovie={handleSelectMovie}
                    />
                )}
                {error && <ErrorMessage message={error} />}
                <WatchedBox
                    watched={watched}
                    onAddWatched={handleAddWatchedMovie}
                    onDeleteWatched={handleDeleteWatchedMovie}
                    selectedMovieId={selectedMovieId}
                    onCloseMovie={handleCloseMovieDetail}
                    selectedMovieInWatchList={selectedMovieInWatchList}
                    selectedMovieUserRating={selectedMovieUserRating}
                />
            </main>
        </>
    );
}

function Logo() {
    return (
        <div className="logo">
            <span role="img">🍿</span>
            <h1>usePopcorn</h1>
        </div>
    );
}

function Search({ query, setQuery }) {
    return (
        <input
            className="search"
            type="text"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
        />
    );
}

function NumResults({ numMovies }) {
    return (
        <p className="num-results">
            Found <strong>{numMovies}</strong> results
        </p>
    );
}

function Loader() {
    return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
    return (
        <p className="error">
            <span>⛔️ </span>
            <span>
                <strong>{message}</strong>
            </span>
        </p>
    );
}

function ListBox({ movies, onSelectMovie }) {
    const [isOpen1, setIsOpen1] = useState(true);

    return (
        <div className="box">
            <button
                className="btn-toggle"
                onClick={() => setIsOpen1((open) => !open)}
            >
                {isOpen1 ? "–" : "+"}
            </button>
            {isOpen1 && (
                <MovieList movies={movies} onSelectMovie={onSelectMovie} />
            )}
        </div>
    );
}

function MovieDetails({
    movieId,
    onCloseMovie,
    onAddWatched,
    selectedMovieInWatchList,
    selectedMovieUserRating,
}) {
    const [movie, setMovie] = useState({});
    const [loading, setLoading] = useState(false);
    const [userRating, setUserRating] = useState("");
    const {
        Title: title,
        Year: year,
        Poster: poster,
        Runtime: runtime,
        imdbRating,
        Plot: plot,
        Released: released,
        Actors: actors,
        Director: director,
        Genre: genre,
    } = movie;

    useEffect(
        function () {
            function callback(e) {
                if (e.code === "Escape") {
                    onCloseMovie();
                }
            }

            document.addEventListener("keydown", callback);

            return function () {
                document.removeEventListener("keydown", callback);
            };
        },
        [onCloseMovie]
    );

    useEffect(
        function () {
            try {
                async function getMovieDetail() {
                    setLoading(true);

                    const response = await fetch(
                        `http://www.omdbapi.com/?apikey=${KEY}&i=${movieId}`
                    );

                    if (!response.ok)
                        throw new Error("Movie details not found");

                    const data = await response.json();

                    setMovie(data);
                    console.log(data);
                }

                getMovieDetail();
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        },
        [movieId]
    );

    useEffect(
        function () {
            if (!title) return;
            document.title = `Movie | ${title}`;

            return function () {
                document.title = "usePopcorn";
            };
        },
        [title]
    );

    function handleAddWatchedMovie() {
        let newWatchedMovie = {
            imdbID: movieId,
            title,
            year,
            poster,
            imdbRating: Number(imdbRating),
            runtime: Number(runtime.split(" ").at(0)),
            userRating,
        };
        onAddWatched(newWatchedMovie);
        onCloseMovie();
    }

    return (
        <div className="details">
            {loading ? (
                <Loader />
            ) : (
                <>
                    <header>
                        <button className="btn-back" onClick={onCloseMovie}>
                            &larr;
                        </button>
                        <img src={poster} alt={`Poster for movie ${title}`} />
                        <div className="details-overview">
                            <h2>
                                {title} {year}
                            </h2>
                            <p>
                                {released} &bull; {runtime}
                            </p>
                            <p>{genre}</p>
                            <p>
                                <span>⭐️</span>
                                {imdbRating} IMDb Rating
                            </p>
                        </div>
                    </header>
                    <section>
                        <div className="rating">
                            {!selectedMovieInWatchList ? (
                                <>
                                    <StarRating
                                        maxRating={10}
                                        size={24}
                                        onSetRating={setUserRating}
                                    />
                                    {userRating > 0 && (
                                        <button
                                            className="btn-add"
                                            onClick={handleAddWatchedMovie}
                                        >
                                            + Add to List
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p>
                                    You rated this movie{" "}
                                    {selectedMovieUserRating} stars
                                </p>
                            )}
                        </div>

                        <p>
                            <em>{plot}</em>
                        </p>
                        <p>Starring {actors}</p>
                        <p>Directed by {director}</p>
                    </section>
                </>
            )}
        </div>
    );
}

function MovieList({ movies, onSelectMovie, selectedMovieInWatchList }) {
    return (
        <ul className="list list-movies">
            {movies?.map((movie) => (
                <Movie
                    movie={movie}
                    key={movie.imdbID}
                    onSelectMovie={onSelectMovie}
                />
            ))}
        </ul>
    );
}

function Movie({ movie, onSelectMovie }) {
    return (
        <li key={movie.imdbID} onClick={() => onSelectMovie(movie.imdbID)}>
            <img src={movie.Poster} alt={`${movie.Title} poster`} />
            <h3>{movie.Title}</h3>
            <div>
                <p>
                    <span>🗓</span>
                    <span>{movie.Year}</span>
                </p>
            </div>
        </li>
    );
}

function WatchedBox({
    watched,
    onAddWatched,
    onDeleteWatched,
    selectedMovieId,
    onCloseMovie,
    selectedMovieInWatchList,
    selectedMovieUserRating,
}) {
    const [isOpen2, setIsOpen2] = useState(true);

    return (
        <div className="box">
            <button
                className="btn-toggle"
                onClick={() => setIsOpen2((open) => !open)}
            >
                {isOpen2 ? "–" : "+"}
            </button>
            {isOpen2 &&
                (selectedMovieId ? (
                    <MovieDetails
                        movieId={selectedMovieId}
                        onCloseMovie={onCloseMovie}
                        onAddWatched={onAddWatched}
                        selectedMovieInWatchList={selectedMovieInWatchList}
                        selectedMovieUserRating={selectedMovieUserRating}
                    />
                ) : (
                    <>
                        <WatchedSummary movies={watched} />
                        <WatchedMovieList
                            movies={watched}
                            onDeleteWatched={onDeleteWatched}
                        />
                    </>
                ))}
        </div>
    );
}

function WatchedSummary({ movies }) {
    const average = (arr) =>
        arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

    const avgImdbRating = average(movies.map((movie) => movie.imdbRating));
    const avgUserRating = average(movies.map((movie) => movie.userRating));
    const avgRuntime = average(movies.map((movie) => movie.runtime));

    return (
        <div className="summary">
            <h2>Movies you watched</h2>
            <div>
                <p>
                    <span>#️⃣</span>
                    <span>{movies.length} movies</span>
                </p>
                <p>
                    <span>⭐️</span>
                    <span>{avgImdbRating}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{avgUserRating}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{avgRuntime} min</span>
                </p>
            </div>
        </div>
    );
}

function WatchedMovieList({ movies, onDeleteWatched }) {
    return (
        <ul className="list">
            {movies.map((movie) => (
                <WatchedMovie
                    movie={movie}
                    key={movie.imdbID}
                    onDeleteWatched={onDeleteWatched}
                />
            ))}
        </ul>
    );
}

function WatchedMovie({ movie, onDeleteWatched }) {
    return (
        <li key={movie.imdbID}>
            <img src={movie.poster} alt={`${movie.title} poster`} />
            <h3>{movie.title}</h3>
            <div>
                <p>
                    <span>⭐️</span>
                    <span>{movie.imdbRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{movie.userRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{movie.runtime} min</span>
                </p>
                <button
                    className="btn-delete"
                    onClick={() => onDeleteWatched(movie.imdbID)}
                    alt="Remove from list"
                >
                    X
                </button>
            </div>
        </li>
    );
}
