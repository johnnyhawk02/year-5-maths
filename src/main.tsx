import { render } from 'preact';
import { App } from './app';
import { applySettings, loadSettings } from './theme';
import './styles.css';

// Colours go on before the first paint so the page never flashes the wrong theme.
applySettings(loadSettings());
render(<App />, document.getElementById('app')!);
