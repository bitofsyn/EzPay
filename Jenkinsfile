pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = "soyounjeong" // Docker Hub 사용자 이름
        DOCKER_REGISTRY_CREDENTIALS = "DOCKER_HUB_CREDENTIALS" // Jenkins Credentials ID
        PROJECT_NAME = "ezpay"
    }

    stages {
        stage('Checkout') {
            steps {
                // Jenkins Job에 연결된 Git Repository의 소스를 자동으로 가져옵니다.
                checkout scm
            }
        }

        stage('Build All Services') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh 'chmod +x gradlew'
                            sh './gradlew clean build'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            // package-lock.json을 사용하면 'npm ci'가 더 빠르고 안정적입니다.
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Setup AI-Server') {
                    steps {
                        dir('ai-category-server') {
                            // Python 가상 환경 설정 및 의존성 설치 (예시)
                            sh 'python3 -m venv .venv'
                            sh '. .venv/bin/activate'
                            sh 'pip install -r requirements.txt'
                            sh 'echo "AI Server setup complete."'
                        }
                    }
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                withCredentials([string(credentialsId: DOCKER_REGISTRY_CREDENTIALS, variable: 'DOCKER_HUB_PASSWORD')]) {
                    sh "echo \$DOCKER_HUB_PASSWORD | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin"

                    // 각 서비스의 이미지를 빌드하고 Push 합니다.
                    sh "docker build -t ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-backend:latest ./backend"
                    sh "docker push ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-backend:latest"

                    sh "docker build -t ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-frontend:latest ./frontend"
                    sh "docker push ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-frontend:latest"

                    sh "docker build -t ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-ai-server:latest ./ai-category-server"
                    sh "docker push ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-ai-server:latest"
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                // Jenkins에 SSH 접속을 위한 Credential을 등록해야 합니다. (ID: SSH_CREDENTIALS)
                // withCredentials([sshUserPrivateKey(credentialsId: 'SSH_CREDENTIALS', keyFileVariable: 'SSH_KEY')]) {
                //     sh '''
                //     ssh -o StrictHostKeyChecking=no -i \$SSH_KEY user@your-server-ip << 'ENDSSH'
                //         cd /path/to/your/project
                //         docker-compose pull
                //         docker-compose up -d --no-build
                //         echo "🚀 Deployment complete!"
                //     ENDSSH
                //     '''
                // }

                echo "배포 단계입니다. 실제 서버 배포를 위해서는 위 주석 처리된 SSH 스크립트를 사용하세요."
                echo "로컬에서 docker-compose를 실행합니다."
                sh 'docker-compose pull'
                sh 'docker-compose up -d --no-build'
            }
        }
    }

    post {
        always {
            // 빌드 후 정리 작업
            sh 'docker logout'
            echo 'Pipeline finished.'
        }
    }
}
