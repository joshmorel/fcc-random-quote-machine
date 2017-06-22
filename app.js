/* fetchJsonp:
 modified version of fetch-jsonp library from : https://github.com/camsong/fetch-jsonp
 */
function fetchJsonp(_url, options = {}) {

  const defaultOptions = {
    timeout: 5000,
    jsonpCallback: 'callback',
    jsonpCallbackFunction: null
  };

  function generateCallbackFunction() {
    return `jsonp_${Date.now()}_${Math.ceil(Math.random() * 100000)}`;
  }

  function removeScript(scriptId) {
    const script = document.getElementById(scriptId);
    if (script) {
      document.getElementsByTagName('head')[0].removeChild(script);
    }
  }

  // to avoid param reassign
  let url = _url;
  const timeout = options.timeout || defaultOptions.timeout;
  const jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;

  let timeoutId;

  return new Promise((resolve, reject) => {
    const callbackFunction = options.jsonpCallbackFunction || generateCallbackFunction();
    const scriptId = `${jsonpCallback}_${callbackFunction}`;

    window[callbackFunction] = (response) => {
      resolve({
        ok: true,
        // keep consistent with fetch API
        json: () => Promise.resolve(response),
      });

      if (timeoutId) clearTimeout(timeoutId);

      removeScript(scriptId);
    };

    // Check if the user set their own params, and if not add a ? to start a list of params
    url += (url.indexOf('?') === -1) ? '?' : '&';

    const jsonpScript = document.createElement('script');
    jsonpScript.setAttribute('src', `${url}${jsonpCallback}=${callbackFunction}`);
    if (options.charset) {
      jsonpScript.setAttribute('charset', options.charset);
    }
    jsonpScript.id = scriptId;
    document.getElementsByTagName('head')[0].appendChild(jsonpScript);

    timeoutId = setTimeout(() => {
      reject(new Error(`JSONP request to ${_url} timed out`));

      removeScript(scriptId);
    }, timeout);

    // Caught if got 404/500
    jsonpScript.onerror = () => {
      reject(new Error(`JSONP request to ${_url} failed`));

      removeScript(scriptId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
}
/* end of fetchJsonp */


const quoteMachine =
  (function IIFE(document) {

    let quotes = [];

    const defaultQuotes = [
      /* In case of Ajax failure fail gracefully*/
      {quoteAuthor: "Billy Wilder",
        quoteText: "Trust your own instinct. Your mistakes might as well be your own, instead of someone elses. "},
      {quoteAuthor: "Jean Vanier", quoteText: "Growth begins when we begin to accept our own weakness. "},
      {quoteAuthor: "Alphonse Karr",
        quoteText: "Some people are always grumbling because roses have thorns; I am thankful that thorns have roses. "
      }];

    /*remove fade-in for quote so animation can happen again*/
    const quoteCardText = document.querySelector('.caption');
    const quoteCardAuthor = document.querySelector('.author');
    const shareButton = document.querySelector('.share-btn');
    const backButton = document.querySelector('.back-btn');
    const quoteAnimated = document.querySelector('.animated');
    /*remove fade-in for quote so animation can happen again*/
    function removeFadeIn(e) {
      quoteAnimated.classList.remove('fadeIn');
    }
    quoteAnimated.addEventListener('animationend', removeFadeIn);

    const endpoint = "https://api.forismatic.com/api/1.0/?method=getQuote&format=jsonp&lang=en&callback=jsonp";
    const tweetBaseUrl = "https://twitter.com/intent/tweet?";

    function getDefaultQuote() {
      return defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
    }

    function getNextQuote() {
      fetchJsonp(endpoint, {jsonpCallback: 'jsonp'})
        .then(blob => blob.json())
        .then(data => {
          // not all quotes returned will have quoteAuthor property
          if (!data.quoteAuthor) {
            data.quoteAuthor = "Anonymous";
          }
          quotes.push(data);
        })
        .catch(() => {
          quotes.push(getDefaultQuote());
        });
    }

    function renderQuotes() {
      const currentQuote = quotes[quotes.length-1];
      quoteAnimated.classList.add('fadeIn');
      quoteCardText.innerText = currentQuote.quoteText.trimRight();
      quoteCardAuthor.innerText = currentQuote.quoteAuthor.trimRight();
      shareButton.setAttribute('href', `${tweetBaseUrl}text="${currentQuote.quoteText}" -${currentQuote.quoteAuthor}`);
      shareButton.style.visibility = "visible";
      //only want to be able to go back if there are at least 2 in array
      backButton.disabled = ( quotes.length <= 1 );
    }

    function showQuote() {
      renderQuotes();
      getNextQuote();
    }

    function goBack() {
      //keep pre-fetched next quote but remove current (most recently displayed) quote
      const nextQuote = quotes.pop();
      quotes.pop();
      renderQuotes();
      quotes.push(nextQuote);
    }

    // get next quote immediately in prep for user pressing button
    getNextQuote();

    return {
      showQuote: showQuote,
      goBack: goBack
    };

  })(window.document);
