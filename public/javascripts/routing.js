// routing
firebase.auth().onAuthStateChanged(user => {
  if(!user && !location.pathname.match(/\/login.html/)) {
    location.href = './login.html';
  } else if(user && location.pathname.match(/\/login.html/)) {
    location.href = './index.html';
  }
});
