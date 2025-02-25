pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = credentials('docker_hub_credentials')  // Jenkins에서 설정한 Docker Hub ID
        DOCKER_HUB_PASSWORD = credentials('docker_hub_credentials')  // Jenkins에서 설정한 Docker Hub 비밀번호 (Access Token)
    }

    stages {
        // 1️⃣ 깃허브에서 최신 코드 가져오기
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        // 2️⃣ .env 파일 로드 (환경변수 적용)
        stage('Load Environment Variables') {
            steps {
                script {
                    def envVars = readFile('.env').trim().split("\n").collectEntries {
                        def parts = it.split("=")
                        [(parts[0].trim()): parts[1].trim()]
                    }
                    envVars.each { key, value -> env[key] = value }
                }
            }
        }

        // 3️⃣ Docker 이미지 빌드 및 Docker Hub 푸시
        stage('Build and Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker_hub_credentials',
                    usernameVariable: 'DOCKER_HUB_USER',
                    passwordVariable: 'DOCKER_HUB_PASS')]) {

                    // Docker Hub 로그인
                    sh 'docker login -u $DOCKER_HUB_USER -p $DOCKER_HUB_PASS'

                    // 이미지 빌드 및 태그 적용
                    sh 'docker build -t $DOCKER_HUB_USER/ezpay:latest .'

                    // Docker Hub에 푸시
                    sh 'docker push $DOCKER_HUB_USER/ezpay:latest'
                }
            }
        }

        // 4️⃣ 기존 컨테이너 종료 및 삭제
        stage('Stop and Remove Previous Container') {
            steps {
                script {
                    sh '''
                    docker stop my_spring_app || echo "Container not found"
                    docker rm my_spring_app || echo "No such container"
                    '''
                }
            }
        }

        // 5️⃣ 새로운 컨테이너 실행 (Docker Hub에서 이미지 가져와 실행)
        stage('Run Docker Container') {
            steps {
                script {
                    sh 'docker run -d -p 8080:8080 --name my_spring_app $DOCKER_HUB_USER/ezpay:latest'
                }
            }
        }
    }
}
