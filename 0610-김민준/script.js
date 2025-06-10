// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- UI 요소 선택 ---
    const createPostButton = document.getElementById('createPostButton');
    const postModal = document.getElementById('postModal');
    const postForm = document.getElementById('postForm');
    const postTitleInput = document.getElementById('postTitle');
    const postAuthorInput = document.getElementById('postAuthor'); // 작성자 입력 필드
    const postContentInput = document.getElementById('postContent');
    const postFilesInput = document.getElementById('postFiles');
    const filePreviewsContainer = document.getElementById('filePreviews');

    const postListSection = document.getElementById('postListSection');
    const postDetailSection = document.getElementById('postDetailSection');
    const postsContainer = document.getElementById('postsContainer');

    const detailTitle = document.getElementById('detailTitle');
    const detailAuthor = document.getElementById('detailAuthor');
    const detailViews = document.getElementById('detailViews');
    const detailDate = document.getElementById('detailDate');
    const detailContent = document.getElementById('detailContent');
    const detailMedia = document.getElementById('detailMedia');
    const backToListButton = document.getElementById('backToListButton');
    const deletePostButton = document.getElementById('deletePostButton');

    // --- 회원가입/로그인 관련 UI 요소 ---
    const registerButton = document.getElementById('registerButton');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const loggedInUserSpan = document.getElementById('loggedInUser');
    const usernameDisplay = document.getElementById('usernameDisplay');

    const registerModal = document.getElementById('registerModal');
    const loginModal = document.getElementById('loginModal');

    const registerForm = document.getElementById('registerForm');
    const regUsernameInput = document.getElementById('regUsername');
    const regPasswordInput = document.getElementById('regPassword');

    const loginForm = document.getElementById('loginForm');
    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');

    // 새로 추가한 UI 요소 선택
    const loginRequiredMessage = document.getElementById('loginRequiredMessage'); 

    // --- 데이터 저장 변수 ---
    let currentPosts = []; // 모든 게시물을 저장할 배열
    let users = [];       // 모든 사용자를 저장할 배열
    let loggedInUser = null; // 현재 로그인된 사용자 정보 (null 또는 { username: '...', id: ... })

    let selectedFiles = []; // 폼에서 선택된 파일들을 저장할 배열

    // --- 헬퍼 함수: 모달 열고 닫기 ---
    function openModal(modalElement) {
        modalElement.classList.add('active');
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('active');
        // 모달 닫을 때 폼 초기화
        const form = modalElement.querySelector('form');
        if (form) form.reset();
        // 게시물 작성 모달일 경우 파일 미리보기 초기화
        if (modalElement.id === 'postModal') {
            selectedFiles.forEach(file => {
                if (file.objectURL) URL.revokeObjectURL(file.objectURL);
            });
            selectedFiles = [];
            filePreviewsContainer.innerHTML = '';
        }
    }

    // 모든 닫기 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', (event) => {
            closeModal(event.target.closest('.modal'));
        });
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        if (event.target === postModal) closeModal(postModal);
        if (event.target === registerModal) closeModal(registerModal);
        if (event.target === loginModal) closeModal(loginModal);
    });

    // --- 데이터 로드 및 초기화 ---
    function loadData() {
        const storedPosts = localStorage.getItem('posts');
        if (storedPosts) {
            currentPosts = JSON.parse(storedPosts);
            currentPosts.forEach(post => {
                post.created_at = new Date(post.created_at);
            });
            currentPosts.sort((a, b) => b.created_at - a.created_at);
        }

        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }

        const storedLoggedInUser = localStorage.getItem('loggedInUser');
        if (storedLoggedInUser) {
            loggedInUser = JSON.parse(storedLoggedInUser);
        }

        updateUIBasedOnLoginStatus(); // 로그인 상태에 따라 UI 업데이트
        renderPostList(); // 게시물 목록 렌더링
    }
    
    // --- UI 업데이트 (로그인 상태에 따라) ---
    function updateUIBasedOnLoginStatus() {
        if (loggedInUser) {
            loggedInUserSpan.style.display = 'inline';
            usernameDisplay.textContent = loggedInUser.username;
            registerButton.style.display = 'none';
            loginButton.style.display = 'none';
            logoutButton.style.display = 'inline';
            createPostButton.disabled = false; // 로그인하면 게시물 작성 가능
            postAuthorInput.value = loggedInUser.username; // 작성자 자동 채움
            postAuthorInput.readOnly = true; // 읽기 전용으로 설정
            if (loginRequiredMessage) { // 요소가 존재하는지 확인 후 display 속성 변경
                loginRequiredMessage.style.display = 'none'; // 로그인하면 안내 문구 숨김
            }
        } else {
            loggedInUserSpan.style.display = 'none';
            registerButton.style.display = 'inline';
            loginButton.style.display = 'inline';
            logoutButton.style.display = 'none';
            createPostButton.disabled = true; // 로그아웃 상태면 게시물 작성 비활성화
            postAuthorInput.value = ''; // 작성자 초기화
            postAuthorInput.readOnly = false; // 읽기 전용 해제
            if (loginRequiredMessage) { // 요소가 존재하는지 확인 후 display 속성 변경
                loginRequiredMessage.style.display = 'inline'; // 로그아웃하면 안내 문구 표시
            }
        }
        // 게시물 상세 페이지에서 삭제 버튼 표시 여부 결정
        if (postDetailSection.classList.contains('active')) {
            const currentPostId = parseInt(deletePostButton.dataset.id);
            const currentPost = currentPosts.find(p => p.id === currentPostId);
            if (loggedInUser && currentPost && currentPost.author_name === loggedInUser.username) {
                deletePostButton.style.display = 'inline'; // 본인 게시물만 삭제 가능
            } else {
                deletePostButton.style.display = 'none';
            }
        }
    }

    // --- 회원가입 기능 ---
    registerButton.addEventListener('click', () => openModal(registerModal));

    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = regUsernameInput.value.trim();
        const password = regPasswordInput.value.trim();

        if (username.length < 4 || password.length < 4) {
            alert('아이디와 비밀번호는 4자 이상이어야 합니다.');
            return;
        }

        if (users.some(user => user.username === username)) {
            alert('이미 존재하는 아이디입니다.');
            return;
        }

        const newUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({ id: newUserId, username: username, password: password }); // 실제로는 비밀번호 해싱 필요
        localStorage.setItem('users', JSON.stringify(users));
        alert('회원가입이 완료되었습니다! 로그인 해주세요.');
        closeModal(registerModal);
        openModal(loginModal); // 회원가입 후 로그인 모달 자동 열기
    });

    // --- 로그인 기능 ---
    loginButton.addEventListener('click', () => openModal(loginModal));

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();

        const user = users.find(u => u.username === username && u.password === password); // 실제로는 해싱된 비밀번호 비교
        if (user) {
            loggedInUser = { id: user.id, username: user.username };
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
            alert(`로그인 성공! ${username}님 환영합니다.`);
            closeModal(loginModal);
            updateUIBasedOnLoginStatus();
        } else {
            alert('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
    });

    // --- 로그아웃 기능 ---
    logoutButton.addEventListener('click', () => {
        loggedInUser = null;
        localStorage.removeItem('loggedInUser'); // localStorage에서 로그인 정보 제거
        alert('로그아웃 되었습니다.');
        updateUIBasedOnLoginStatus();
        // 로그아웃 시 게시물 작성 모달이 열려있다면 닫기
        if (postModal.classList.contains('active')) {
            closeModal(postModal);
        }
        // 상세 페이지에서 삭제 버튼 숨김
        if (postDetailSection.classList.contains('active')) {
            deletePostButton.style.display = 'none';
        }
    });

    // --- 게시물 목록 렌더링 ---
    function renderPostList() {
        postsContainer.innerHTML = '';
        if (currentPosts.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts-message">아직 게시물이 없습니다. 새 게시물을 작성해 보세요!</p>';
            return;
        }

        currentPosts.forEach(post => {
            const listItem = document.createElement('li');
            listItem.classList.add('post-item');
            listItem.dataset.id = post.id;

            let thumbnailHtml = '';
            if (post.media_files && post.media_files.length > 0) {
                const firstMedia = post.media_files.find(
                    media => media.type.startsWith('image/') || media.type.startsWith('video/')
                );
                if (firstMedia) {
                    if (firstMedia.type.startsWith('image/') || firstMedia.type.startsWith('image/gif')) {
                         thumbnailHtml = `<img src="${firstMedia.url}" alt="썸네일" class="thumbnail">`;
                    } else if (firstMedia.type.startsWith('video/')) {
                        thumbnailHtml = `<video src="${firstMedia.url}" controls muted class="thumbnail"></video>`;
                    }
                }
            }

            // --- 수정된 부분: 템플릿 리터럴 문법 오류 수정 ---
            listItem.innerHTML = `
                <h3>${post.title}</h3>
                <p class="meta">작성자: <strong>${post.author_name}</strong> | 조회수: ${post.views} | 작성일: ${new Date(post.created_at).toLocaleString()}</p>
                ${thumbnailHtml}
            `;
            postsContainer.appendChild(listItem);

            listItem.addEventListener('click', () => showPostDetail(post.id));
        });
    }

    // --- 게시물 상세 보기 ---
    function showPostDetail(id) {
        const post = currentPosts.find(p => p.id === id);
        if (!post) {
            alert('게시물을 찾을 수 없습니다.');
            return;
        }

        // 조회수 증가
        post.views++;
        localStorage.setItem('posts', JSON.stringify(currentPosts));

        detailTitle.textContent = post.title;
        detailAuthor.textContent = post.author_name;
        detailViews.textContent = post.views;
        detailDate.textContent = new Date(post.created_at).toLocaleString();
        detailContent.innerHTML = `<p>${post.content}</p>`;

        detailMedia.innerHTML = '';
        if (post.media_files && post.media_files.length > 0) {
            post.media_files.forEach(media => {
                const mediaItem = document.createElement('div');
                mediaItem.classList.add('media-item');
                if (media.type.startsWith('image/') || media.type.startsWith('image/gif')) {
                    mediaItem.innerHTML = `<img src="${media.url}" alt="첨부 이미지">`;
                } else if (media.type.startsWith('video/')) {
                    // --- 수정된 부분: 템플릿 리터럴 문법 오류 수정 ---
                    mediaItem.innerHTML = `<video controls><source src="${media.url}" type="${media.type}"></video>`;
                } else {
                    mediaItem.innerHTML = `<p>지원하지 않는 파일: ${media.name}</p>`;
                }
                detailMedia.appendChild(mediaItem);
            });
        }

        deletePostButton.dataset.id = post.id;
        // 로그인된 사용자만 본인 게시물을 삭제할 수 있도록 버튼 표시 여부 결정
        if (loggedInUser && post.author_name === loggedInUser.username) {
            deletePostButton.style.display = 'inline';
        } else {
            deletePostButton.style.display = 'none';
        }

        postListSection.classList.remove('active');
        postDetailSection.classList.add('active');
    }

    // --- 새 게시물 작성 모달 열기 ---
    createPostButton.addEventListener('click', () => {
        if (!loggedInUser) {
            alert('게시물 작성은 로그인 후 이용해주세요.');
            openModal(loginModal); // 로그인 모달 열기
            return;
        }
        openModal(postModal);
        postForm.reset();
        selectedFiles = [];
        filePreviewsContainer.innerHTML = '';
        postAuthorInput.value = loggedInUser.username; // 로그인된 사용자 이름 자동 채움
    });


    // --- 파일 선택 및 미리보기 ---
    postFilesInput.addEventListener('change', (event) => {
        selectedFiles.forEach(file => { // 기존 미리보기 URL 해제
            if (file.objectURL) URL.revokeObjectURL(file.objectURL);
        });
        selectedFiles = []; // 기존 선택 파일 초기화
        filePreviewsContainer.innerHTML = ''; // 미리보기 초기화

        const files = event.target.files;
        if (files.length === 0) return;

        Array.from(files).forEach(file => {
            const objectURL = URL.createObjectURL(file);
            selectedFiles.push({ file: file, objectURL: objectURL, type: file.type, name: file.name });

            const previewItem = document.createElement('div');
            previewItem.classList.add('preview-item');

            let mediaElement;
            if (file.type.startsWith('image/') || file.type.startsWith('image/gif')) {
                mediaElement = document.createElement('img');
                mediaElement.src = objectURL;
                mediaElement.alt = '미리보기 이미지';
            } else if (file.type.startsWith('video/')) {
                mediaElement = document.createElement('video');
                mediaElement.src = objectURL;
                mediaElement.controls = true;
                mediaElement.muted = true;
            } else {
                mediaElement = document.createElement('p');
                mediaElement.textContent = '지원하지 않는 파일';
            }
            previewItem.appendChild(mediaElement);

            const removeButton = document.createElement('span');
            removeButton.classList.add('remove-file');
            removeButton.textContent = 'x';
            removeButton.addEventListener('click', () => {
                selectedFiles = selectedFiles.filter(item => item.objectURL !== objectURL);
                previewItem.remove();
                URL.revokeObjectURL(objectURL);
            });
            previewItem.appendChild(removeButton);

            filePreviewsContainer.appendChild(previewItem);
        });
    });

    // --- 게시물 폼 제출 처리 ---
    postForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const title = postTitleInput.value.trim();
        const author = postAuthorInput.value.trim(); // 로그인된 사용자 이름으로 자동 채워짐
        const content = postContentInput.value.trim();

        if (!title || !author || !content) {
            alert('제목, 작성자, 내용을 모두 입력해주세요.');
            return;
        }
        if (!loggedInUser || loggedInUser.username !== author) { // 보안을 위한 추가 확인 (클라이언트 측)
            alert('로그인된 사용자와 작성자 정보가 일치하지 않습니다. 다시 로그인 해주세요.');
            return;
        }

        const newPostId = currentPosts.length > 0 ? Math.max(...currentPosts.map(p => p.id)) + 1 : 1;

        const mediaPromises = selectedFiles.map(item => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        name: item.name,
                        type: item.type,
                        url: reader.result
                    });
                };
                reader.readAsDataURL(item.file);
            });
        });

        Promise.all(mediaPromises).then(mediaFilesData => {
            const newPost = {
                id: newPostId,
                title: title,
                author_name: author,
                content: content,
                created_at: new Date(),
                views: 0,
                media_files: mediaFilesData
            };

            currentPosts.push(newPost);
            localStorage.setItem('posts', JSON.stringify(currentPosts));

            alert('게시물이 성공적으로 작성되었습니다!');
            closeModal(postModal); // 모달 닫기
            renderPostList(); // 목록 새로고침

            selectedFiles.forEach(file => URL.revokeObjectURL(file.objectURL));
            selectedFiles = [];
            filePreviewsContainer.innerHTML = '';

        }).catch(error => {
            console.error("파일 처리 중 오류 발생:", error);
            alert("게시물 작성 중 파일 처리 오류가 발생했습니다.");
        });
    });

    // --- 목록으로 돌아가기 버튼 ---
    backToListButton.addEventListener('click', () => {
        postDetailSection.classList.remove('active');
        postListSection.classList.add('active');
        renderPostList(); // 목록으로 돌아갈 때 목록을 다시 렌더링하여 조회수 업데이트
    });

    // --- 게시물 삭제 버튼 ---
    deletePostButton.addEventListener('click', () => {
        const postIdToDelete = parseInt(deletePostButton.dataset.id);

        // 삭제 권한 확인: 로그인된 사용자가 게시물 작성자인지
        const postToDelete = currentPosts.find(post => post.id === postIdToDelete);
        if (!loggedInUser || !postToDelete || postToDelete.author_name !== loggedInUser.username) {
            alert('본인이 작성한 게시물만 삭제할 수 있습니다.');
            return;
        }

        if (confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
            currentPosts = currentPosts.filter(post => post.id !== postIdToDelete);
            localStorage.setItem('posts', JSON.stringify(currentPosts));
            alert('게시물이 삭제되었습니다.');
            postDetailSection.classList.remove('active');
            postListSection.classList.add('active');
            renderPostList();
        }
    });

    // 페이지 로드 시 모든 데이터 로드
    loadData();
});