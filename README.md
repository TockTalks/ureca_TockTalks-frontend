# 톡톡스 (TockTalks) — Frontend

[백엔드 레포](https://github.com/TockTalks/ureca_TockTalks)와 연동되는 프론트엔드입니다. React + Vite + TypeScript.

## 🧱 기술 스택

- React 19 / TypeScript
- Vite

## 🚀 시작하기

### 1. 저장소 클론 & 설치

```bash
git clone https://github.com/TockTalks/ureca_TockTalks-frontend.git
cd ureca_TockTalks-frontend
npm install
```

### 2. (선택) 환경변수 설정

기본값으로도 로컬 개발은 바로 됩니다. 배포용 API 오리진을 쓰려면 `.env.example`을 복사해서 채우세요.

```bash
cp .env.example .env
```

```
VITE_API_BASE_URL=   # 비워두면 dev 프록시(/api -> http://localhost:8080)를 사용
```

### 3. 백엔드 실행

이 프론트는 [`ureca_TockTalks`](https://github.com/TockTalks/ureca_TockTalks) 백엔드가 `http://localhost:8080`에서 떠 있어야 API가 붙습니다. 백엔드 레포의 README를 참고해서 먼저 띄워주세요.

### 4. dev 서버 실행

```bash
npm run dev
```

```
http://localhost:5173
```

화면에 "Backend API: 🟢 connected"가 뜨면 백엔드 연동까지 정상입니다.

## 🛑 종료하기

- dev 서버를 실행한 터미널에서 `Ctrl+C`
- 백엔드도 같이 내리려면 백엔드 레포 README의 종료 방법을 따르세요.

## 📦 빌드

```bash
npm run build     # dist/ 에 프로덕션 빌드 생성
npm run preview   # 빌드 결과 로컬 미리보기
```
