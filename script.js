// script.js

document.addEventListener('DOMContentLoaded', () => {
    const createPostButton = document.getElementById('createPostButton');
    const postModal = document.getElementById('postModal');
    const closeModalButton = postModal.querySelector('.close-button');
    const postForm = document.getElementById('postForm');
    const postTitleInput = document.getElementById('postTitle');
    const postAuthorInput = document.getElementById('postAuthor');
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

    let currentPosts = []; // 모든 게시물을 저장할 배열
    let selectedFiles = []; // 폼에서 선택된 파일들을 저장할 배열

    // --- 데이터 로드 및 초기화 ---
    function loadPosts() {
        const storedPosts = localStorage.getItem('posts');
        if (storedPosts) {
            currentPosts = JSON.parse(storedPosts);
            // 날짜 문자열을 Date 객체로 변환 (필요시)
            currentPosts.forEach(post => {
                post.created_at = new Date(post.created_at);
            });
            // 최신순 정렬
            currentPosts.sort((a, b) => b.created_at - a.created_at);
        }
        renderPostList(); // 게시물 목록 렌더링
    }

    // --- 게시물 목록 렌더링 ---
    function renderPostList() {
        postsContainer.innerHTML = ''; // 기존 목록 초기화
        if (currentPosts.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts-message">아직 게시물이 없습니다. 새 게시물을 작성해 보세요!</p>';
            return;
        }

        currentPosts.forEach(post => {
            const listItem = document.createElement('li');
            listItem.classList.add('post-item');
            listItem.dataset.id = post.id; // 게시물 ID 저장

            let thumbnailHtml = '';
            // 첫 번째 이미지 또는 GIF 파일을 썸네일로 사용
            if (post.media_files && post.media_files.length > 0) {
                const firstMedia = post.media_files.find(
                    media => media.type.startsWith('image/') || media.type.startsWith('video/') // 비디오도 썸네일로 고려
                );
                if (firstMedia) {
                    if (firstMedia.type.startsWith('image/') || firstMedia.type.startsWith('image/gif')) {
                         thumbnailHtml = `<img src="${firstMedia.url}" alt="썸네일" class="thumbnail">`;
                    } else if (firstMedia.type.startsWith('video/')) {
                        thumbnailHtml = `<video src="${firstMedia.url}" controls muted class="thumbnail"></video>`;
                    }
                }
            }


            listItem.innerHTML = `
                <h3>${post.title}</h3>
                <p class="meta">작성자: <strong>${post.author_name}</strong> | 조회수: ${post.views} | 작성일: ${new Date(post.created_at).toLocaleString()}</p>
                ${thumbnailHtml}
            `;
            postsContainer.appendChild(listItem);

            // 클릭 이벤트 리스너 추가
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

        // 조회수 증가 (임시 로직)
        post.views++;
        localStorage.setItem('posts', JSON.stringify(currentPosts)); // localStorage 업데이트

        detailTitle.textContent = post.title;
        detailAuthor.textContent = post.author_name;
        detailViews.textContent = post.views;
        detailDate.textContent = new Date(post.created_at).toLocaleString();
        detailContent.innerHTML = `<p>${post.content}</p>`; // p 태그로 감싸서 내용 표시

        detailMedia.innerHTML = ''; // 기존 미디어 초기화
        if (post.media_files && post.media_files.length > 0) {
            post.media_files.forEach(media => {
                const mediaItem = document.createElement('div');
                mediaItem.classList.add('media-item');
                if (media.type.startsWith('image/') || media.type.startsWith('image/gif')) {
                    mediaItem.innerHTML = `<img src="${media.url}" alt="첨부 이미지">`;
                } else if (media.type.startsWith('video/')) {
                    mediaItem.innerHTML = `<video controls><source src="${media.url}" type="${media.type}"></video>`;
                } else {
                    mediaItem.innerHTML = `<p>지원하지 않는 파일: ${media.name}</p>`;
                }
                detailMedia.appendChild(mediaItem);
            });
        }

        deletePostButton.dataset.id = post.id; // 삭제 버튼에 게시물 ID 저장

        // 섹션 전환
        postListSection.classList.remove('active');
        postDetailSection.classList.add('active');
    }

    // --- 새 게시물 작성 모달 열기 ---
    createPostButton.addEventListener('click', () => {
        postModal.classList.add('active');
        // 폼 초기화
        postForm.reset();
        selectedFiles = [];
        filePreviewsContainer.innerHTML = '';
    });

    // --- 모달 닫기 ---
    closeModalButton.addEventListener('click', () => {
        postModal.classList.remove('active');
        // 미리보기 URL 해제 (메모리 누수 방지)
        selectedFiles.forEach(file => {
            if (file.objectURL) {
                URL.revokeObjectURL(file.objectURL);
            }
        });
        selectedFiles = []; // 파일 선택 초기화
        filePreviewsContainer.innerHTML = ''; // 미리보기 초기화
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        if (event.target === postModal) {
            postModal.classList.remove('active');
        }
    });

    // --- 파일 선택 및 미리보기 ---
    postFilesInput.addEventListener('change', (event) => {
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

            // 파일 삭제 버튼
            const removeButton = document.createElement('span');
            removeButton.classList.add('remove-file');
            removeButton.textContent = 'x';
            removeButton.addEventListener('click', () => {
                // 선택된 파일 목록에서 제거
                selectedFiles = selectedFiles.filter(item => item.objectURL !== objectURL);
                // 미리보기 DOM에서도 제거
                previewItem.remove();
                // URL 해제
                URL.revokeObjectURL(objectURL);
                // 파일 인풋 초기화 (선택된 파일 다시 반영)
                // 실제 file input에는 직접 접근해서 파일을 제거하기 어려우므로,
                // 제출 시 selectedFiles 배열만 사용하는 것이 더 견고합니다.
                // 여기서는 UI만 업데이트한다고 가정합니다.
            });
            previewItem.appendChild(removeButton);

            filePreviewsContainer.appendChild(previewItem);
        });
    });

    // --- 게시물 폼 제출 처리 ---
    postForm.addEventListener('submit', (event) => {
        event.preventDefault(); // 폼 기본 제출 방지

        const title = postTitleInput.value.trim();
        const author = postAuthorInput.value.trim();
        const content = postContentInput.value.trim();

        if (!title || !author || !content) {
            alert('제목, 작성자, 내용을 모두 입력해주세요.');
            return;
        }

        // 새로운 게시물 ID 생성 (간단한 방법)
        const newPostId = currentPosts.length > 0 ? Math.max(...currentPosts.map(p => p.id)) + 1 : 1;

        // 미디어 파일 데이터를 Base64로 변환 (localStorage 저장을 위해)
        // 실제 운영에서는 Base64는 비효율적이므로 서버에 파일 자체를 업로드해야 합니다.
        const mediaPromises = selectedFiles.map(item => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        name: item.name,
                        type: item.type,
                        url: reader.result // Base64 인코딩된 URL
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
                media_files: mediaFilesData // Base64 인코딩된 파일 데이터
            };

            currentPosts.push(newPost);
            localStorage.setItem('posts', JSON.stringify(currentPosts)); // localStorage에 저장

            alert('게시물이 성공적으로 작성되었습니다!');
            postModal.classList.remove('active'); // 모달 닫기
            renderPostList(); // 목록 새로고침
            // 미리보기 URL 해제
            selectedFiles.forEach(file => URL.revokeObjectURL(file.objectURL));
            selectedFiles = []; // 선택된 파일 초기화
            filePreviewsContainer.innerHTML = ''; // 미리보기 초기화

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
        if (confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
            currentPosts = currentPosts.filter(post => post.id !== postIdToDelete);
            localStorage.setItem('posts', JSON.stringify(currentPosts));
            alert('게시물이 삭제되었습니다.');
            postDetailSection.classList.remove('active');
            postListSection.classList.add('active');
            renderPostList(); // 목록 새로고침
        }
    });

    // 페이지 로드 시 게시물 로드
    loadPosts();
});