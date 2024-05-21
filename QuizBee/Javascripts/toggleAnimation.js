const st = {};
var isLogin = false;

st.flap = document.querySelector('#flap');
st.toggle = document.querySelector('.toggle');

st.choice1 = document.querySelector('#choice1');
st.choice2 = document.querySelector('#choice2');

st.flap.addEventListener('transitionend', () => {

    if (st.choice1.checked) {
        st.toggle.style.transform = 'rotateY(-15deg)';
        setTimeout(() => st.toggle.style.transform = '', 400);
    } else {
        st.toggle.style.transform = 'rotateY(15deg)';
        setTimeout(() => st.toggle.style.transform = '', 400);
    }

})

st.clickHandler = (e) => {

    var accountCon = document.getElementById("joinBox");
    var joinCon = document.getElementById("loginBox");
    if (e.target.tagName === 'LABEL') {
        setTimeout(() => {
            st.flap.children[0].textContent = e.target.textContent;
            
        }, 250);

    if(!registerCon.classList.contains("hidden")) {
        registerCon.classList.add("hidden");
    }

    if(isLogin) {
        accountCon.classList.add('hidden');
        joinCon.classList.remove('hidden');
        isLogin = false;
    }
    else {
        accountCon.classList.remove('hidden');
        joinCon.classList.add('hidden');
        isLogin = true;
    }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    st.flap.children[0].textContent = st.choice2.nextElementSibling.textContent;
    isLogin = false;
});

document.addEventListener('click', (e) => st.clickHandler(e));