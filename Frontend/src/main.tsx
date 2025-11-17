import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {BrowserRouter} from "react-router-dom";
import App from "./App.tsx";
import {Provider} from "react-redux";
import {store} from "./Redux/store/store.ts";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Provider store={store}>
          <BrowserRouter>
              <App />
          </BrowserRouter>
      </Provider>
  </StrictMode>,
)
