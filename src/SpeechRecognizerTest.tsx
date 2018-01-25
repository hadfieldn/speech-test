import * as React from 'react';
import { Annyang } from 'annyang';
const annyang: Annyang = require('annyang');
// const SpeechKITTCss = require('speechkitt/dist/themes/flat.css');
// const SpeechKITT = require('speechkitt/src/speechkitt').SpeechKITT;
import * as Fuse from 'fuse.js';
import styled from 'styled-components';
const FuzzySet = require('fuzzyset.js');

const LastText: any = styled.span`
  color: ${(props: {isMatch: boolean }) => props.isMatch ? 'blue' : 'inherit'};
`;

class SpeechRecognizerTest extends React.Component {
    state = {
        matches: 0,
        text: '',
        lastText: '',
        isMatch: false,
        lastScore: 0,
    };

    componentDidMount() {

        const list = [
            {
                phrase: 'what questions do you have for me',
            }
        ];

        var options = {
            shouldSort: true,
            threshold: 1,
            location: 0,
            distance: 100,
            includeScore: true,
            includeMatches: true,
            findAllMatches: true,
            maxPatternLength: 120,
            minMatchCharLength: 1,
            keys: [
                'phrase',
            ]
        };
        const fuse = new Fuse(list, options); // "list" is the item array
        const fuzzySet = new FuzzySet();
        fuzzySet.add(list[0].phrase);

        const fuzzySetResults = fuzzySet.get(`blah blah blah how are yout today? what questions do you`
         + `have for me? let's talk about it`);
        console.log({ fuzzySetResults });

        if (annyang) {
            var commands = {
                'show tps report': function() {
                    console.error(`Here's your TPS report!`);
                }
            };
            annyang.addCommands(commands);
            annyang.debug(true);
            annyang.addCallback('result', (userSaid, commandText, results) => {
                const text = userSaid ? userSaid[0] || '' : '';

                this.setState({ text: this.state.text + this.state.lastText, lastText: text });

                console.log({ userSaid, commandText, results });
                const searchResults: { score: number }[] = fuse.search(text);
                if (searchResults.length > 0) {
                    const searchResult = searchResults[0];
                    const score = searchResult.score;
                    const isMatch = score <= 0.03;
                    this.setState({ isMatch, lastScore: score });
                } else {
                    this.setState({ isMatch: false, lastScore: 0 });
                }
                console.log({ searchResults });
            });
            annyang.start();
            console.log('componentDidMount');
            // SpeechKITT.annyang();
            // SpeechKITT.setStylesheet(SpeechKITTCss);
            // SpeechKITT.vroom();
        }
    }
    render() {
        const { matches, lastText, isMatch, lastScore } = this.state;
        return (
            <div style={{ textAlign: 'left'}}>
                <div>Matches: {matches}</div>
                <div>Last score: {lastScore}</div>
                <div>Transcription: <LastText isMatch={isMatch}>{lastText}</LastText></div>
            </div>
        );
    }
}

export default SpeechRecognizerTest;
