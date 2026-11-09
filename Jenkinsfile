pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
    }

    parameters {
        booleanParam(
            name: 'DEPLOY_LOCAL',
            defaultValue: true,
            description: 'CI 성공 후 이 Mac의 Docker Compose 환경에 배포합니다.'
        )
    }

    environment {
        COMPOSE_PROJECT_NAME = 'ezpay'
        DOCKER_BUILDKIT = '1'
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        EZPAY_ENV_DIR = "${env.HOME}/.jenkins/ezpay-env"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend CI') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend CI') {
            steps {
                dir('backend') {
                    sh 'chmod +x gradlew'
                    sh './gradlew clean test --no-daemon'
                }
            }
        }

        stage('Prepare local deployment') {
            when {
                expression { params.DEPLOY_LOCAL }
            }
            steps {
                sh '''
                    set -eu
                    test -f "$EZPAY_ENV_DIR/backend.env"
                    test -f "$EZPAY_ENV_DIR/frontend.env"
                    test -f "$EZPAY_ENV_DIR/ai-category.env"

                    install -m 600 "$EZPAY_ENV_DIR/backend.env" backend/.env
                    install -m 600 "$EZPAY_ENV_DIR/frontend.env" frontend/.env
                    mkdir -p ai-category-server/config
                    install -m 600 "$EZPAY_ENV_DIR/ai-category.env" ai-category-server/config/.env

                    docker info >/dev/null
                    docker compose version
                    docker compose config --quiet
                '''
            }
        }

        stage('Deploy with Docker Compose') {
            when {
                expression { params.DEPLOY_LOCAL }
            }
            steps {
                sh '''
                    set -eu
                    docker compose build
                    docker compose up -d
                    ./scripts/jenkins-health-check.sh
                '''
            }
        }
    }

    post {
        always {
            sh '''
                rm -f backend/.env frontend/.env ai-category-server/config/.env
                if docker info >/dev/null 2>&1; then
                    docker compose ps || true
                fi
            '''
        }
        success {
            echo 'EzPay CI/CD pipeline completed successfully.'
        }
        failure {
            echo 'EzPay CI/CD pipeline failed. Check the failed stage and container logs.'
        }
    }
}
