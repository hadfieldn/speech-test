import * as React from 'react';
import { Annyang } from 'annyang';
const annyang: Annyang = require('annyang');
// const SpeechKITTCss = require('speechkitt/dist/themes/flat.css');
// const SpeechKITT = require('speechkitt/src/speechkitt').SpeechKITT;
// import * as Fuse from 'fuse.js';
import styled from 'styled-components';
import * as _ from 'lodash';
const FuzzySet = require('fuzzyset.js');
const fuzzysearch = require('fuzzysearch/index');

const LastText: any = styled.span`
  color: ${(props: {isMatch: boolean }) => props.isMatch ? 'blue' : 'inherit'};
`;
const MatchPhrase: any = styled.span`
  color: lightseagreen;
`;
const ErrorMessage: any = styled.div`
  color: red;
`;

interface State {
    matches: number;
    text: string;
    lastText: string;
    isMatch: boolean;
    lastScore: number;
    error?: any;
}

function levenshteinSubstr(s: string, t: string, maxEdits: number) {
    // from https://codehost.wordpress.com/2011/09/13/fuzzy-substring-matching/
    // http://ginstrom.com/scribbles/2007/12/01/fuzzy-substring-matching-with-levenshtein-distance-in-python/
    const n = t.length;
    const m = s.length;
    let currRow = _.fill(Array(n + 1), 0); // d[i]
    let prevRow = _.fill(Array(n + 1), 0); // d[i - 1]

    let minim = 0;
    for (let i = 1; i <= m; i++) {
        let tmp = currRow; // swap the rows => i++
        currRow = prevRow;
        prevRow = tmp;

        minim = currRow[0] = i;
        for (let j = 1; j <= n; j++) {
            let value;
            if (s[i - 1] === t[j - 1]) {
                value = prevRow[j - 1];
            } else {
                value = Math.min(
                    currRow[j - 1], // d[i][j - 1]
                    prevRow[j - 1], // d[i - 1][j - 1]
                    prevRow[j] // d[i - 1][j]
                ) + 1;
            }
            if (value < minim) {
                minim = value;
            }
            currRow[j] = value;
        }

        // Check if the previous row will exceed max_edits
        if (minim > maxEdits) {
            return minim;
        }
    }

    return minim;
}

function getSimilarityIndex(s: string, t: string, maxEdits: number) {
    const dist = levenshteinSubstr(s, t, maxEdits);
    let minLength = s.length > t.length ? t.length : s.length;
    return (minLength === 0) ? 1 : 1 - dist / minLength;
}

class SpeechRecognizerTest extends React.Component<any, State> {
    state: State = {
        matches: 0,
        text: '',
        lastText: '',
        isMatch: false,
        lastScore: 0,
    };

    list = [
        {
            phrase: 'what questions do you have for me',
        }
    ];

    componentDidMount() {

        const list = this.list;

        // const options = {
        //     shouldSort: true,
        //     threshold: 1,
        //     location: 0,
        //     distance: 100,
        //     tokenize: false,
        //     includeScore: true,
        //     includeMatches: true,
        //     findAllMatches: true,
        //     maxPatternLength: list[0].phrase.length,
        //     minMatchCharLength: 10,
        //     keys: [
        //         'phrase',
        //     ]
        // };
        // const fuse = new Fuse(list, options); // "list" is the item array
        const fuzzySet = new FuzzySet();
        fuzzySet.add(list[0].phrase);

        const fuzzySetResults = fuzzySet.get(`blah blah blah how are yout today? what questions do you`
         + `have for me? let's talk about it`);
        console.log({ fuzzySetResults });

        if (annyang) {
            const commands = {
                'show tps report': function() {
                    console.error(`Here's your TPS report!`);
                }
            };
            annyang.addCommands(commands);
            annyang.debug(true);
            annyang.addCallback('error', (error) => {
                console.error(error);
                this.setState({ error });
            });
            annyang.addCallback('soundstart', () => {
                console.log('Sound started...');
            });
            annyang.addCallback('result', (userSaid, commandText, results) => {
                const text = userSaid ? userSaid[0] || '' : '';

                this.setState({ text: this.state.text + this.state.lastText, lastText: text });

                console.log({ userSaid, commandText, results });

                const fuzzySetScore = fuzzySet.get(text);
                console.log({ fuzzySetScore });

                const score = getSimilarityIndex(list[0].phrase, text, 10);
                console.log({ score });

                const isMatch = score > 0.75;

                this.setState({ isMatch, lastScore: score });

                const isFuzzySearchMatch = fuzzysearch(list[0].phrase, text);
                console.log({ isFuzzySearchMatch });

                // if (fuzzySetScore) {
                //     const score = fuzzySetScore[0][0];
                //     console.log(`Score: ${score}`);
                //     const isMatch = score >= 0.75;
                //     this.setState({ isMatch, lastScore: score });
                // } else {
                //     this.setState({ isMatch: false, lastScore: 0 });
                // }

                // const searchResults: { score: number }[] = fuse.search(text);
                // if (searchResults.length > 0) {
                //     const searchResult = searchResults[0];
                //     const score = (1 - searchResult.score);
                //     const isMatch = score >= 0.5;
                //     this.setState({ isMatch, lastScore: score });
                // } else {
                //     this.setState({ isMatch: false, lastScore: 0 });
                // }
                // console.log({ searchResults });
            });
            annyang.start({ continuous: true, autoRestart: true });
            console.log('componentDidMount');
            // SpeechKITT.annyang();
            // SpeechKITT.setStylesheet(SpeechKITTCss);
            // SpeechKITT.vroom();
        }
    }
    render() {
        const { error, lastText, isMatch, lastScore } = this.state;
        const score = lastScore.toLocaleString('en', {style: 'percent', maximumFractionDigits: 1});
        return (
            <div style={{ textAlign: 'left'}}>
                <div>Phrase to match: <MatchPhrase>"{this.list[0].phrase}"</MatchPhrase></div>
                <div>Transcription: <LastText isMatch={isMatch}>{lastText}</LastText></div>
                <div>Score: {score}</div>
                {error && <ErrorMessage>{error.message}</ErrorMessage>}
            </div>
        );
    }
}

export default SpeechRecognizerTest;
