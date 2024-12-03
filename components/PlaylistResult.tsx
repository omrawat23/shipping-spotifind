"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Copy, ChevronDown, ChevronUp, Music, Disc, Clock, Loader2 } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { motion } from "framer-motion"

interface Song {
  id: string;
  name: string;
  artist: string;
  album?: string;
  year?: string;
  images?: string[];
  genres?: string[];
  explanation?: string;
  spotifyId?: string;
}

interface PlaylistResultProps {
  playlist: Song[];
  playlistName: string;
}

export default function PlaylistResult({ playlist, playlistName }: PlaylistResultProps) {
  const [copiedAll, setCopiedAll] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const router = useRouter()

  const copyAllSongs = () => {
    const allSongs = playlist
      .map((song, index) => `${index + 1}. ${song.name} - ${song.artist}`)
      .join("\n")
    
    navigator.clipboard.writeText(allSongs).then(() => {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
      toast({
        title: "Copied to clipboard",
        description: "All songs have been copied to your clipboard.",
      })
    })
  }

  const createSpotifyPlaylist = async () => {
    setCreatingPlaylist(true)
    try {
      const createResponse = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          description: `Playlist created by AI: ${playlistName}`,
        }),
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create playlist")
      }

      const { id: playlistId } = await createResponse.json()

      const trackUris = playlist
        .map((song) => song.spotifyId ? `spotify:track:${song.spotifyId}` : null)
        .filter(Boolean)

      const addTracksResponse = await fetch(`/api/playlists/${playlistId}/add-tracks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: trackUris,
        }),
      })

      if (!addTracksResponse.ok) {
        throw new Error("Failed to add tracks to playlist")
      }

      toast({
        title: "Success",
        description: "Playlist created and tracks added successfully!",
      })
      
      router.push('/dashboard/ai-playlist')
    } catch (error) {
      console.error("Error creating Spotify playlist:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create Spotify playlist",
        variant: "destructive",
      })
    } finally {
      setCreatingPlaylist(false)
    }
  }

  return (
    <div className="min-h-screen mb-24">
      <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6  p-6 rounded-lg shadow-lg">
      <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center">
        <Music className="mr-3 h-8 w-8 md:h-10 md:w-10 text-purple-300" />
        <span className="break-words">{playlistName}</span>
      </h1>
      <div className="flex flex-wrap gap-4">
        <Button
          variant="outline"
          onClick={copyAllSongs}
          className="bg-white text-purple-900 border-purple-300 hover:bg-purple-100 transition-colors duration-300 px-6 py-2 rounded-full font-semibold"
        >
          {copiedAll ? (
            <Check className="h-5 w-5 mr-2 text-green-500" />
          ) : (
            <Copy className="h-5 w-5 mr-2 text-purple-900" />
          )}
          {copiedAll ? "Copied!" : "Copy All"}
        </Button>
        <Button
          onClick={createSpotifyPlaylist}
          disabled={creatingPlaylist}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors duration-300 px-6 py-2 rounded-full shadow-md"
        >
          {creatingPlaylist ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Spotify Playlist"
          )}
        </Button>
      </div>
    </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {playlist.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="flex flex-col items-center justify-center text-center bg-[rgba(39,39,39,0.705)] p-2.5 rounded-[50px] h-min min-w-[300px] min-h-[25rem]">
              <div className="w-full rounded-[50px] hover:opacity-65 hover:bg-black/60 transition-all duration-300">
                <div className="relative aspect-square">
                  <Image
                    src={song.images?.[0] || '/placeholder.svg'}
                    alt={`${song.name} album art`}
                    fill
                    className="object-cover rounded-[50px] p-3"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center items-center text-center p-0">
                <h3 className="text-[1.225rem] font-semibold my-2 mt-2 mb-1.5 text-white">
                  {song.name}
                </h3>
                <p className="text-gray-400 text-xs italic">
                  {song.artist}
                </p>
              </div>
            </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
