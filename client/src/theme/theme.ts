import { createTheme as createMuiTheme, Theme } from '@mui/material/styles';

export const createTheme = (mode: 'light' | 'dark' = 'dark'): Theme => {
  return createMuiTheme({
    palette: {
      mode,
      primary: {
        main: '#000000',
        dark: '#000000',
        light: '#333333'
      },
      secondary: {
        main: '#8B5CF6',
        dark: '#7C3AED',
        light: '#A855F7'
      },
      background: {
        default: mode === 'dark' ? '#000000' : '#FFFFFF',
        paper: mode === 'dark' ? '#000000' : '#F8FAFC'
      },
      text: {
        primary: mode === 'dark' ? '#FFFFFF' : '#0F172A',
        secondary: mode === 'dark' ? '#C4C4C4' : '#8e9297'
      },
      divider: mode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : '#CBD5E1',
      error: {
        main: '#f04747'
      },
      warning: {
        main: '#faa61a'
      },
      info: {
        main: '#7289da'
      },
      success: {
        main: '#8B5CF6'
      }
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        letterSpacing: '-0.025em'
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        letterSpacing: '-0.025em'
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.5rem',
        letterSpacing: '-0.025em'
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.25rem',
        letterSpacing: '-0.025em'
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.125rem'
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem'
      },
      body1: {
        fontSize: '0.875rem',
        lineHeight: 1.6
      },
      body2: {
        fontSize: '0.75rem',
        lineHeight: 1.5
      }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
          scrollbarWidth: 'thin',
          scrollbarColor: mode === 'dark' ? 'rgba(138, 43, 226, 0.3) #000000' : '#8A2BE2 #F8FAFC',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'dark' ? '#000000' : '#F8FAFC'
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'dark' ? 'rgba(138, 43, 226, 0.5)' : '#8A2BE2',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: mode === 'dark' ? 'rgba(138, 43, 226, 0.7)' : '#9932CC'
          }
        }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '0.875rem',
            padding: '10px 20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transition: 'left 0.5s ease-in-out'
            },
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              transform: 'translateY(-2px) scale(1.02)',
              boxShadow: mode === 'dark' 
                ? '0 8px 25px rgba(139, 92, 246, 0.3)'
                : '0 8px 25px rgba(0, 0, 0, 0.15)',
              '&::before': {
                left: '100%'
              }
            },
            '&:active': {
              transform: 'translateY(0) scale(0.98)'
            }
          },
          contained: {
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, #000000 0%, #333333 100%)'
              : '#000000',
            color: '#ffffff',
            boxShadow: mode === 'dark'
              ? '0 4px 15px rgba(139, 92, 246, 0.4)'
              : 'none',
            '&:hover': {
              background: mode === 'dark'
                ? 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
                : '#1a1a1a',
              boxShadow: mode === 'dark'
                ? '0 8px 30px rgba(139, 92, 246, 0.6)'
                : 'none',
              transform: 'translateY(-3px) scale(1.05)'
            }
          },
          outlined: {
            borderColor: mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : '#CBD5E1',
            color: mode === 'dark' ? '#FFFFFF' : '#0F172A',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: mode === 'dark' ? '#8B5CF6' : '#8B5CF6',
              boxShadow: mode === 'dark'
                ? '0 0 20px rgba(139, 92, 246, 0.4)'
                : 'none'
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: mode === 'dark' ? '#000000' : '#F8FAFC',
              borderRadius: '8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '& fieldset': {
                borderColor: mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : '#CBD5E1',
                borderWidth: '1px'
              },
              '&:hover fieldset': {
                borderColor: mode === 'dark' ? '#8B5CF6' : '#8B5CF6',
                borderWidth: '2px',
                boxShadow: mode === 'dark'
                  ? '0 0 15px rgba(139, 92, 246, 0.2)'
                  : 'none'
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'dark' ? '#8B5CF6' : '#8B5CF6',
                borderWidth: '2px',
                boxShadow: mode === 'dark'
                  ? '0 0 20px rgba(139, 92, 246, 0.4)'
                  : 'none'
              },
              '& input': {
                color: mode === 'dark' ? '#FFFFFF' : '#0F172A',
                transition: 'all 0.2s ease-in-out'
              },
              '& input::placeholder': {
                color: mode === 'dark' ? '#C4C4C4' : '#8e9297',
                opacity: 1
              }
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            backgroundColor: mode === 'dark' ? '#000000' : '#FFFFFF',
            border: mode === 'dark' ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid #CBD5E1',
            boxShadow: mode === 'dark'
              ? '0 4px 20px 0 rgba(139, 92, 246, 0.15)'
              : '0 2px 10px 0 rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            backgroundColor: mode === 'dark' ? '#000000' : '#FFFFFF',
            border: mode === 'dark' ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid #CBD5E1',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: mode === 'dark'
              ? '0 2px 15px rgba(139, 92, 246, 0.1)'
              : 'none',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: mode === 'dark' ? '#8B5CF6' : '#8B5CF6',
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: mode === 'dark'
                ? '0 8px 30px rgba(139, 92, 246, 0.25)'
                : '0 8px 25px rgba(0, 0, 0, 0.15)'
            }
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '0',
              height: '0',
              borderRadius: '50%',
              background: mode === 'dark'
                ? 'rgba(139, 92, 246, 0.3)'
                : 'rgba(67, 181, 129, 0.3)',
              transform: 'translate(-50%, -50%)',
              transition: 'width 0.3s ease-out, height 0.3s ease-out'
            },
            '&:hover': {
              backgroundColor: mode === 'dark'
                ? 'rgba(139, 92, 246, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              transform: 'scale(1.1) rotate(5deg)',
              '&::before': {
                width: '100%',
                height: '100%'
              }
            },
            '&:active': {
              transform: 'scale(0.95)'
            }
          }
        }
      }
    }
  });
};