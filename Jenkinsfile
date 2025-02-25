pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = credentials('docker_hub_username')  // Jenkins에서 설정한 Docker Hub ID
        DOCKER_HUB_PASSWORD = credentials('docker_hub_password')  // Jenkins에서 설정한 Docker Hub 비밀번호 (Access Token)
    }

    triggers {
        githubPush()  // GitHub에서 push 이벤트가 발생하면 자동 실행
    }

    stages {
        // 1️⃣ GitHub에서 최신 코드 가져오기
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        // 2️⃣ Gradle 테스트 실행 (옵션: 필요 시 생략 가능)
        stage('Run Tests') {
            steps {
                bat './gradlew test --no-daemon'
            }
        }

        // 3️⃣ Docker 이미지 빌드 및 Docker Hub 푸시
        stage('Build and Push Docker Image') {
            steps {
                script {
                    sh 'docker login -u $DOCKER_HUB_USERNAME -p $DOCKER_HUB_PASSWORD'
                    sh 'docker build -t $DOCKER_HUB_USERNAME/ezpay:latest .'  // 이미지 빌드
                    sh 'docker push $DOCKER_HUB_USERNAME/ezpay:latest'  // Docker Hub로 푸시
                }
            }
        }

        // 4️⃣ 기존 컨테이너 중단 및 삭제
        stage('Stop and Remove Previous Container') {
            steps {
                script {
                    sh '''
                    docker stop my_spring_app || true
                    docker rm my_spring_app || true
                    '''
                }
            }
        }

        // 5️⃣ 최신 Docker 이미지로 컨테이너 실행
        stage('Run Docker Container') {
            steps {
                script {
                    sh 'docker run -d -p 8080:8080 --name my_spring_app $DOCKER_HUB_USERNAME/ezpay:latest'
                }
            }
        }
    }
}
