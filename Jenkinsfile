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

        // ✅ 환경 변수 로드 추가
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

        // 2️⃣ Docker Hub 로그인 및 이미지 빌드 & 푸시
        stage('Build and Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker_hub_credentials',
                    usernameVariable: 'DOCKER_HUB_USER',
                    passwordVariable: 'DOCKER_HUB_PASS')]) {

                    // Docker Hub 로그인
                    sh 'echo $DOCKER_HUB_PASS | docker login -u $DOCKER_HUB_USER --password-stdin'

                    // 이미지 빌드 및 태그 적용
                    sh 'docker build -t $DOCKER_HUB_USER/ezpay:latest .'

                    // Docker Hub에 푸시
                    sh 'docker push $DOCKER_HUB_USER/ezpay:latest'
                }
            }
        }

        // 3️⃣ 기존 컨테이너 종료 및 삭제
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

        // 4️⃣ Docker Compose로 새로운 컨테이너 실행
        stage('Run Docker Container with Compose') {
            steps {
                script {
                    sh '''
                    docker-compose down || echo "No existing containers to stop"
                    docker-compose pull
                    docker-compose up -d --build
                    '''
                }
            }
        }
    }
}
