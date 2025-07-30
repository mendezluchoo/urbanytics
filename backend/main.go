package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// Configuración de la aplicación
type Config struct {
	DBConnStr string
	JWTSecret string
	Port      string
}

// Estructuras de datos
type Property struct {
	SerialNumber    int64   `json:"serial_number"`
	ListYear        int     `json:"list_year"`
	DateRecorded    string  `json:"date_recorded"`
	Town            string  `json:"town"`
	Address         string  `json:"address"`
	AssessedValue   float64 `json:"assessed_value"`
	SaleAmount      float64 `json:"sale_amount"`
	SalesRatio      float64 `json:"sales_ratio"`
	PropertyType    string  `json:"property_type"`
	ResidentialType string  `json:"residential_type"`
	YearsUntilSold  int     `json:"years_until_sold"`
}

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

type App struct {
	config *Config
	db     *pgxpool.Pool
}

// Inicializar configuración
func loadConfig() *Config {
	return &Config{
		DBConnStr: getEnv("DB_CONN_STR", "postgresql://user_urbanytics:password_urbanytics@localhost:5432/db_urbanytics"),
		JWTSecret: getEnv("JWT_SECRET", generateRandomSecret()),
		Port:      getEnv("PORT", "8080"),
	}
}

// Generar secreto aleatorio para JWT
func generateRandomSecret() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return base64.StdEncoding.EncodeToString(bytes)
}

// Obtener variable de entorno con valor por defecto
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Crear nueva aplicación
func NewApp(config *Config) *App {
	return &App{
		config: config,
	}
}

// Conectar a la base de datos
func (app *App) connectDB() error {
	pool, err := pgxpool.New(context.Background(), app.config.DBConnStr)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %v", err)
	}
	app.db = pool
	return nil
}

// Generar token JWT
func (app *App) generateJWT(userID int, username, role string) (string, error) {
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "urbanytics-backend",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(app.config.JWTSecret))
}

// Middleware de autenticación JWT
func (app *App) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(app.config.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// Middleware de autorización para admin
func (app *App) adminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// Configurar rutas
func (app *App) setupRoutes() *gin.Engine {
	router := gin.Default()

	// Configuración CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Endpoints públicos
	router.GET("/health", app.healthCheck)

	// API v1
	v1 := router.Group("/api/v1")
	{
		// Endpoints públicos (sin autenticación)
		v1.POST("/auth/login", app.login)
		v1.POST("/auth/register", app.register)
		v1.GET("/properties", app.getProperties)
		v1.GET("/properties/:id", app.getPropertyByID)
		v1.GET("/properties/filters/cities", app.getCities)
		v1.GET("/properties/filters/property-types", app.getPropertyTypes)
		v1.GET("/properties/filters/residential-types", app.getResidentialTypes)
		v1.GET("/properties/filters/list-years", app.getListYears)
		v1.GET("/analytics/kpis", app.getKPIs)
		v1.GET("/analytics/trends-by-year", app.getTrendsByYear)
		v1.GET("/analytics/avg-price-by-town", app.getAveragePriceByTown)
		v1.GET("/analytics/property-type-analysis", app.getPropertyTypeAnalysis)
		v1.GET("/analytics/sales-ratio-distribution", app.getSalesRatioDistribution)
		v1.GET("/analytics/time-to-sell-distribution", app.getTimeToSellDistribution)
		v1.GET("/analytics/top-cities-by-volume", app.getTopCitiesByVolume)

		// Endpoints protegidos (requieren autenticación)
		protected := v1.Group("/")
		protected.Use(app.authMiddleware())
		{
			// Endpoints de usuario
			protected.GET("/profile", app.getProfile)
			protected.PUT("/profile", app.updateProfile)

			// Endpoints de admin (requieren rol admin)
			admin := protected.Group("/admin")
			admin.Use(app.adminMiddleware())
			{
				admin.POST("/properties", app.createProperty)
				admin.PUT("/properties/:id", app.updateProperty)
				admin.DELETE("/properties/:id", app.deleteProperty)
				admin.GET("/users", app.getUsers)
				admin.POST("/users", app.createUser)
				admin.PUT("/users/:id", app.updateUser)
				admin.DELETE("/users/:id", app.deleteUser)
			}
		}
	}

	return router
}

// Endpoint de salud
func (app *App) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "urbanytics-backend",
		"version":   "2.0.0",
		"timestamp": time.Now().UTC(),
	})
}

// Autenticación
func (app *App) login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Buscar usuario en la base de datos
	var user User
	var passwordHash string
	err := app.db.QueryRow(context.Background(),
		"SELECT id, username, email, role, password_hash FROM users WHERE username = $1",
		req.Username).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &passwordHash)

	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		} else {
			log.Printf("Database error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}

	// Verificar contraseña
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generar token JWT
	token, err := app.generateJWT(user.ID, user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"token":   token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

// Registro de usuario
func (app *App) register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Hash de contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Insertar usuario en la base de datos
	var userID int
	err = app.db.QueryRow(context.Background(),
		"INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
		req.Username, req.Email, string(hashedPassword), "user").Scan(&userID)

	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
		} else {
			log.Printf("Database error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		}
		return
	}

	// Generar token JWT
	token, err := app.generateJWT(userID, req.Username, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"token":   token,
		"user": gin.H{
			"id":       userID,
			"username": req.Username,
			"email":    req.Email,
			"role":     "user",
		},
	})
}

// Obtener perfil de usuario
func (app *App) getProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Obtener datos del usuario desde la base de datos
	var user User
	err := app.db.QueryRow(context.Background(),
		"SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1",
		userID).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			log.Printf("Database error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user": gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"email":      user.Email,
			"role":       user.Role,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		},
	})
}

// Actualizar perfil de usuario
func (app *App) updateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Actualizar en la base de datos
	result, err := app.db.Exec(context.Background(),
		"UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
		req.Email, userID)

	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Profile updated successfully",
		"user_id": userID,
	})
}

// Obtener propiedades con filtros y paginación
func (app *App) getProperties(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Obtener filtros
	town := c.Query("town")
	minPrice := c.Query("min_price")
	maxPrice := c.Query("max_price")
	propertyType := c.Query("property_type")
	residentialType := c.Query("residential_type")
	listYear := c.Query("list_year")
	status := c.Query("status")
	minSalesRatio := c.Query("min_sales_ratio")
	maxSalesRatio := c.Query("max_sales_ratio")
	minYearsUntilSold := c.Query("min_years_until_sold")
	maxYearsUntilSold := c.Query("max_years_until_sold")
	sortBy := c.DefaultQuery("sort_by", "serial_number")
	sortOrder := c.DefaultQuery("sort_order", "asc")

	// Construir query base
	baseQuery := "SELECT serial_number, list_year, date_recorded, town, address, assessed_value, sale_amount, sales_ratio, property_type, residential_type, years_until_sold FROM properties"
	var conditions []string
	var args []interface{}
	argID := 1

	// Agregar filtros
	if town != "" {
		conditions = append(conditions, fmt.Sprintf("town ILIKE $%d", argID))
		args = append(args, "%"+town+"%")
		argID++
	}
	if minPrice != "" {
		conditions = append(conditions, fmt.Sprintf("sale_amount >= $%d", argID))
		args = append(args, minPrice)
		argID++
	}
	if maxPrice != "" {
		conditions = append(conditions, fmt.Sprintf("sale_amount <= $%d", argID))
		args = append(args, maxPrice)
		argID++
	}
	if propertyType != "" {
		conditions = append(conditions, fmt.Sprintf("property_type = $%d", argID))
		args = append(args, propertyType)
		argID++
	}
	if residentialType != "" {
		conditions = append(conditions, fmt.Sprintf("residential_type = $%d", argID))
		args = append(args, residentialType)
		argID++
	}
	if listYear != "" {
		conditions = append(conditions, fmt.Sprintf("list_year = $%d", argID))
		args = append(args, listYear)
		argID++
	}
	if status != "" {
		if status == "sold" {
			conditions = append(conditions, "sale_amount > 0")
		} else if status == "available" {
			conditions = append(conditions, "sale_amount = 0")
		}
	}
	if minSalesRatio != "" {
		conditions = append(conditions, fmt.Sprintf("sales_ratio >= $%d", argID))
		args = append(args, minSalesRatio)
		argID++
	}
	if maxSalesRatio != "" {
		conditions = append(conditions, fmt.Sprintf("sales_ratio <= $%d", argID))
		args = append(args, maxSalesRatio)
		argID++
	}
	if minYearsUntilSold != "" {
		conditions = append(conditions, fmt.Sprintf("years_until_sold >= $%d", argID))
		args = append(args, minYearsUntilSold)
		argID++
	}
	if maxYearsUntilSold != "" {
		conditions = append(conditions, fmt.Sprintf("years_until_sold <= $%d", argID))
		args = append(args, maxYearsUntilSold)
		argID++
	}

	// Construir query final
	finalQuery := baseQuery
	if len(conditions) > 0 {
		finalQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	// Agregar ordenamiento
	finalQuery += fmt.Sprintf(" ORDER BY %s %s LIMIT %d OFFSET %d", sortBy, sortOrder, limit, offset)

	// Ejecutar query
	rows, err := app.db.Query(context.Background(), finalQuery, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query properties"})
		return
	}
	defer rows.Close()

	var properties []Property
	for rows.Next() {
		var p Property
		err := rows.Scan(&p.SerialNumber, &p.ListYear, &p.DateRecorded, &p.Town, &p.Address, &p.AssessedValue, &p.SaleAmount, &p.SalesRatio, &p.PropertyType, &p.ResidentialType, &p.YearsUntilSold)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan property"})
			return
		}
		properties = append(properties, p)
	}

	// Contar total
	countQuery := "SELECT COUNT(*) FROM properties"
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var totalCount int
	err = app.db.QueryRow(context.Background(), countQuery, args...).Scan(&totalCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count properties"})
		return
	}

	totalPages := (totalCount + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    properties,
		"pagination": gin.H{
			"current_page": page,
			"total_pages":  totalPages,
			"total_count":  totalCount,
			"limit":        limit,
			"offset":       offset,
		},
	})
}

// Obtener propiedad por ID
func (app *App) getPropertyByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid property ID"})
		return
	}

	var p Property
	err = app.db.QueryRow(context.Background(),
		"SELECT serial_number, list_year, date_recorded, town, address, assessed_value, sale_amount, sales_ratio, property_type, residential_type, years_until_sold FROM properties WHERE serial_number = $1",
		id).Scan(&p.SerialNumber, &p.ListYear, &p.DateRecorded, &p.Town, &p.Address, &p.AssessedValue, &p.SaleAmount, &p.SalesRatio, &p.PropertyType, &p.ResidentialType, &p.YearsUntilSold)

	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    p,
	})
}

// Obtener ciudades
func (app *App) getCities(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), "SELECT DISTINCT town FROM properties WHERE town IS NOT NULL AND town != 'Nan' ORDER BY town")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query cities"})
		return
	}
	defer rows.Close()

	var cities []string
	for rows.Next() {
		var city string
		err := rows.Scan(&city)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan city"})
			return
		}
		cities = append(cities, city)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    cities,
	})
}

// Obtener tipos de propiedad
func (app *App) getPropertyTypes(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), "SELECT DISTINCT property_type FROM properties WHERE property_type IS NOT NULL AND property_type != 'Nan' ORDER BY property_type")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query property types"})
		return
	}
	defer rows.Close()

	var propertyTypes []string
	for rows.Next() {
		var propertyType string
		err := rows.Scan(&propertyType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan property type"})
			return
		}
		propertyTypes = append(propertyTypes, propertyType)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    propertyTypes,
	})
}

// Obtener tipos residenciales
func (app *App) getResidentialTypes(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), "SELECT DISTINCT residential_type FROM properties WHERE residential_type IS NOT NULL AND residential_type != 'Nan' ORDER BY residential_type")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query residential types"})
		return
	}
	defer rows.Close()

	var residentialTypes []string
	for rows.Next() {
		var residentialType string
		err := rows.Scan(&residentialType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan residential type"})
			return
		}
		residentialTypes = append(residentialTypes, residentialType)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    residentialTypes,
	})
}

// Obtener años de listado
func (app *App) getListYears(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), "SELECT DISTINCT list_year FROM properties WHERE list_year IS NOT NULL ORDER BY list_year")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query list years"})
		return
	}
	defer rows.Close()

	var years []int
	for rows.Next() {
		var year int
		err := rows.Scan(&year)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan year"})
			return
		}
		years = append(years, year)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    years,
	})
}

// Obtener KPIs
func (app *App) getKPIs(c *gin.Context) {
	var totalProperties int
	err := app.db.QueryRow(context.Background(), "SELECT COUNT(*) FROM properties").Scan(&totalProperties)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total properties"})
		return
	}

	var avgPrice float64
	err = app.db.QueryRow(context.Background(), "SELECT AVG(sale_amount) FROM properties WHERE sale_amount > 0").Scan(&avgPrice)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get average price"})
		return
	}

	var avgSalesRatio float64
	err = app.db.QueryRow(context.Background(), "SELECT AVG(sales_ratio) FROM properties WHERE sales_ratio > 0").Scan(&avgSalesRatio)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get average sales ratio"})
		return
	}

	var avgYearsUntilSold float64
	err = app.db.QueryRow(context.Background(), "SELECT AVG(years_until_sold) FROM properties WHERE years_until_sold >= 0").Scan(&avgYearsUntilSold)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get average years until sold"})
		return
	}

	var topCity string
	var topCityCount int
	err = app.db.QueryRow(context.Background(), `
		SELECT town, COUNT(*) as count 
		FROM properties 
		WHERE town IS NOT NULL 
		GROUP BY town 
		ORDER BY count DESC 
		LIMIT 1
	`).Scan(&topCity, &topCityCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get top city"})
		return
	}

	var topPropertyType string
	var topPropertyTypeCount int
	err = app.db.QueryRow(context.Background(), `
		SELECT property_type, COUNT(*) as count 
		FROM properties 
		WHERE property_type IS NOT NULL 
		GROUP BY property_type 
		ORDER BY count DESC 
		LIMIT 1
	`).Scan(&topPropertyType, &topPropertyTypeCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get top property type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_properties":         totalProperties,
			"average_price":            avgPrice,
			"average_sales_ratio":      avgSalesRatio,
			"average_years_until_sold": avgYearsUntilSold,
			"top_city": gin.H{
				"name":  topCity,
				"count": topCityCount,
			},
			"top_property_type": gin.H{
				"name":  topPropertyType,
				"count": topPropertyTypeCount,
			},
		},
	})
}

// Obtener tendencias por año
func (app *App) getTrendsByYear(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), `
		SELECT 
			list_year,
			COUNT(*) as total_sales,
			AVG(sale_amount) as avg_price,
			AVG(sales_ratio) as avg_sales_ratio,
			AVG(years_until_sold) as avg_years_until_sold
		FROM properties 
		WHERE list_year IS NOT NULL 
		GROUP BY list_year 
		ORDER BY list_year
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query trends"})
		return
	}
	defer rows.Close()

	var trends []gin.H
	for rows.Next() {
		var year int
		var totalSales int
		var avgPrice, avgSalesRatio, avgYearsUntilSold float64

		err := rows.Scan(&year, &totalSales, &avgPrice, &avgSalesRatio, &avgYearsUntilSold)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan trend data"})
			return
		}

		trends = append(trends, gin.H{
			"year":                 year,
			"total_sales":          totalSales,
			"avg_price":            avgPrice,
			"avg_sales_ratio":      avgSalesRatio,
			"avg_years_until_sold": avgYearsUntilSold,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    trends,
	})
}

// Obtener precio promedio por ciudad
func (app *App) getAveragePriceByTown(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), `
		SELECT 
			town,
			AVG(sale_amount) as average_price,
			COUNT(*) as count
		FROM properties 
		WHERE town IS NOT NULL AND sale_amount > 0
		GROUP BY town 
		ORDER BY average_price DESC
		LIMIT 20
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query average price by town"})
		return
	}
	defer rows.Close()

	var towns []gin.H
	for rows.Next() {
		var town string
		var avgPrice float64
		var count int

		err := rows.Scan(&town, &avgPrice, &count)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan town data"})
			return
		}

		towns = append(towns, gin.H{
			"town":          town,
			"average_price": avgPrice,
			"count":         count,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    towns,
	})
}

// Obtener análisis por tipo de propiedad
func (app *App) getPropertyTypeAnalysis(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), `
		SELECT 
			property_type,
			COUNT(*) as count,
			AVG(sale_amount) as average_price,
			AVG(sales_ratio) as avg_sales_ratio
		FROM properties 
		WHERE property_type IS NOT NULL
		GROUP BY property_type 
		ORDER BY count DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query property type analysis"})
		return
	}
	defer rows.Close()

	var propertyTypes []gin.H
	for rows.Next() {
		var propertyType string
		var count int
		var avgPrice, avgSalesRatio float64

		err := rows.Scan(&propertyType, &count, &avgPrice, &avgSalesRatio)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan property type data"})
			return
		}

		propertyTypes = append(propertyTypes, gin.H{
			"property_type":   propertyType,
			"count":           count,
			"average_price":   avgPrice,
			"avg_sales_ratio": avgSalesRatio,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    propertyTypes,
	})
}

// Obtener distribución de ratio de venta
func (app *App) getSalesRatioDistribution(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), `
		SELECT 
			CASE 
				WHEN sales_ratio < 0.8 THEN '< 80%'
				WHEN sales_ratio < 0.9 THEN '80-90%'
				WHEN sales_ratio < 1.0 THEN '90-100%'
				WHEN sales_ratio < 1.1 THEN '100-110%'
				WHEN sales_ratio < 1.2 THEN '110-120%'
				ELSE '> 120%'
			END as range,
			COUNT(*) as count,
			ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM properties WHERE sales_ratio > 0), 2) as percentage
		FROM properties 
		WHERE sales_ratio > 0
		GROUP BY range
		ORDER BY 
			CASE range
				WHEN '< 80%' THEN 1
				WHEN '80-90%' THEN 2
				WHEN '90-100%' THEN 3
				WHEN '100-110%' THEN 4
				WHEN '110-120%' THEN 5
				ELSE 6
			END
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query sales ratio distribution"})
		return
	}
	defer rows.Close()

	var distribution []gin.H
	for rows.Next() {
		var rangeStr string
		var count int
		var percentage float64

		err := rows.Scan(&rangeStr, &count, &percentage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan sales ratio data"})
			return
		}

		distribution = append(distribution, gin.H{
			"range":      rangeStr,
			"count":      count,
			"percentage": percentage,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    distribution,
	})
}

// Obtener distribución de tiempo hasta venta
func (app *App) getTimeToSellDistribution(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), `
		SELECT 
			CASE 
				WHEN years_until_sold = 0 THEN '0 años'
				WHEN years_until_sold = 1 THEN '1 año'
				WHEN years_until_sold = 2 THEN '2 años'
				WHEN years_until_sold = 3 THEN '3 años'
				WHEN years_until_sold = 4 THEN '4 años'
				ELSE '5+ años'
			END as range,
			COUNT(*) as count,
			ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM properties WHERE years_until_sold >= 0), 2) as percentage
		FROM properties 
		WHERE years_until_sold >= 0
		GROUP BY range
		ORDER BY 
			CASE range
				WHEN '0 años' THEN 1
				WHEN '1 año' THEN 2
				WHEN '2 años' THEN 3
				WHEN '3 años' THEN 4
				WHEN '4 años' THEN 5
				ELSE 6
			END
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query time to sell distribution"})
		return
	}
	defer rows.Close()

	var distribution []gin.H
	for rows.Next() {
		var rangeStr string
		var count int
		var percentage float64

		err := rows.Scan(&rangeStr, &count, &percentage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan time to sell data"})
			return
		}

		distribution = append(distribution, gin.H{
			"range":      rangeStr,
			"count":      count,
			"percentage": percentage,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    distribution,
	})
}

// Obtener top ciudades por volumen
func (app *App) getTopCitiesByVolume(c *gin.Context) {
	rows, err := app.db.Query(context.Background(), `
		SELECT 
			town,
			COUNT(*) as count,
			AVG(sale_amount) as average_price
		FROM properties 
		WHERE town IS NOT NULL
		GROUP BY town 
		ORDER BY count DESC
		LIMIT 10
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query top cities by volume"})
		return
	}
	defer rows.Close()

	var cities []gin.H
	for rows.Next() {
		var town string
		var count int
		var avgPrice float64

		err := rows.Scan(&town, &count, &avgPrice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan city data"})
			return
		}

		cities = append(cities, gin.H{
			"town":          town,
			"count":         count,
			"average_price": avgPrice,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    cities,
	})
}

// Endpoints de administración

// Crear propiedad
func (app *App) createProperty(c *gin.Context) {
	var property Property
	if err := c.ShouldBindJSON(&property); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Insertar en base de datos
	_, err := app.db.Exec(context.Background(),
		"INSERT INTO properties (serial_number, list_year, date_recorded, town, address, assessed_value, sale_amount, sales_ratio, property_type, residential_type, years_until_sold) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
		property.SerialNumber, property.ListYear, property.DateRecorded, property.Town, property.Address, property.AssessedValue, property.SaleAmount, property.SalesRatio, property.PropertyType, property.ResidentialType, property.YearsUntilSold)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create property"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    property,
	})
}

// Actualizar propiedad
func (app *App) updateProperty(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid property ID"})
		return
	}

	var property Property
	if err := c.ShouldBindJSON(&property); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	log.Printf("Updating property %d with data: %+v", id, property)

	// Actualizar en base de datos
	result, err := app.db.Exec(context.Background(),
		"UPDATE properties SET list_year = $1, date_recorded = $2, town = $3, address = $4, assessed_value = $5, sale_amount = $6, sales_ratio = $7, property_type = $8, residential_type = $9, years_until_sold = $10 WHERE serial_number = $11",
		property.ListYear, property.DateRecorded, property.Town, property.Address, property.AssessedValue, property.SaleAmount, property.SalesRatio, property.PropertyType, property.ResidentialType, property.YearsUntilSold, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update property"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    property,
	})
}

// Eliminar propiedad
func (app *App) deleteProperty(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid property ID"})
		return
	}

	result, err := app.db.Exec(context.Background(), "DELETE FROM properties WHERE serial_number = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete property"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Property deleted successfully",
	})
}

// Obtener usuarios (admin)
func (app *App) getUsers(c *gin.Context) {
	rows, err := app.db.Query(context.Background(),
		"SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY id")
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}
	defer rows.Close()

	var users []gin.H
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			log.Printf("Error scanning user: %v", err)
			continue
		}
		users = append(users, gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"email":      user.Email,
			"role":       user.Role,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
	})
}

// Crear usuario (admin)
func (app *App) createUser(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Hash de la contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Insertar usuario en la base de datos
	var userID int
	err = app.db.QueryRow(context.Background(),
		"INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
		req.Username, req.Email, string(hashedPassword), "user").Scan(&userID)

	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
		} else {
			log.Printf("Database error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		}
		return
	}

	user := gin.H{
		"id":       userID,
		"username": req.Username,
		"email":    req.Email,
		"role":     "user",
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    user,
	})
}

// Actualizar usuario (admin)
func (app *App) updateUser(c *gin.Context) {
	userID := c.Param("id")
	id, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Email string `json:"email" binding:"required,email"`
		Role  string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validar rol
	if req.Role != "admin" && req.Role != "user" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be 'admin' or 'user'"})
		return
	}

	// Actualizar en la base de datos
	result, err := app.db.Exec(context.Background(),
		"UPDATE users SET email = $1, role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
		req.Email, req.Role, id)

	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user := gin.H{
		"id":    id,
		"email": req.Email,
		"role":  req.Role,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// Eliminar usuario (admin)
func (app *App) deleteUser(c *gin.Context) {
	userID := c.Param("id")
	id, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Eliminar de la base de datos
	result, err := app.db.Exec(context.Background(),
		"DELETE FROM users WHERE id = $1", id)

	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User deleted successfully",
		"user_id": id,
	})
}

func main() {
	// Cargar configuración
	config := loadConfig()

	// Crear aplicación
	app := NewApp(config)

	// Conectar a la base de datos
	if err := app.connectDB(); err != nil {
		log.Fatal(err)
	}
	defer app.db.Close()

	// Configurar rutas
	router := app.setupRoutes()

	// Iniciar servidor
	log.Printf("🚀 Backend iniciado en puerto %s", config.Port)
	log.Printf("📊 Health check: http://localhost:%s/health", config.Port)
	log.Printf("🔐 Auth endpoints: http://localhost:%s/api/v1/auth", config.Port)
	log.Printf("🏠 Properties API: http://localhost:%s/api/v1/properties", config.Port)
	log.Printf("📈 Analytics API: http://localhost:%s/api/v1/analytics", config.Port)

	if err := router.Run(":" + config.Port); err != nil {
		log.Fatal(err)
	}
}
